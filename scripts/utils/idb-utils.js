const DATABASE_NAME = "dicoding-story-db";
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = "stories";

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        const objectStore = db.createObjectStore(OBJECT_STORE_NAME, {
          keyPath: "id",
        });
        objectStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images");
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const cacheImage = async (url) => {
  if (!url) return false;

  try {
    const cache = await caches.open("dicoding-story-images-v1");
    await cache.add(new Request(url, { mode: "no-cors" }));
    return true;
  } catch (error) {
    console.warn("Error caching image with service worker:", error);

    try {
      const response = await fetch(url, { mode: "no-cors" });
      const imageBlob = await response.blob();

      const cache = await caches.open("dicoding-story-images-v1");
      await cache.put(url, new Response(imageBlob));

      return true;
    } catch (fetchError) {
      console.error("Error fetching image for cache:", fetchError);
      return false;
    }
  }
};

const getImageFromCache = async (url) => {
  try {
    const cache = await caches.open("dicoding-story-images-v1");
    const cachedResponse = await cache.match(url);

    if (cachedResponse && cachedResponse.ok) {
      return URL.createObjectURL(await cachedResponse.blob());
    }

    const db = await openDB();
    const transaction = db.transaction("images", "readonly");
    const store = transaction.objectStore("images");
    const imageBlob = await store.get(url);

    if (imageBlob) {
      return URL.createObjectURL(imageBlob);
    }

    return "/images/offline-placeholder.jpg";
  } catch (error) {
    console.error("Error getting image from cache:", error);
    return "/images/offline-placeholder.jpg";
  }
};

const saveImage = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image");

    const blob = await response.blob();
    const db = await openDB();
    const transaction = db.transaction("images", "readwrite");
    const store = transaction.objectStore("images");

    await store.put(blob, url);
    console.log("Image saved to IndexedDB:", url);
    return true;
  } catch (error) {
    console.error("Error saving image:", error);
    return false;
  }
};

const saveStories = async (stories) => {
  const db = await openDB();
  const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
  const store = transaction.objectStore(OBJECT_STORE_NAME);

  stories.forEach((story) => {
    store.put(story);

    if (story.photoUrl) {
      try {
        caches
          .open("dicoding-story-images-v1")
          .then((cache) => cache.add(story.photoUrl))
          .catch((error) =>
            console.warn(
              "Could not cache image via SW:",
              error,
              story.photoUrl,
            ),
          );
      } catch (error) {
        console.warn("Error in caching story image:", error);
      }
    }
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve(true);
    };

    transaction.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const getStories = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction(OBJECT_STORE_NAME, "readonly");
    const store = transaction.objectStore(OBJECT_STORE_NAME);
    const index = store.index("createdAt");

    return new Promise((resolve, reject) => {
      const request = index.getAll();

      request.onsuccess = () => {
        const stories = request.result.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        resolve(stories);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error("Error getting stories from IndexedDB:", error);
    return [];
  }
};

const getStory = async (id) => {
  const db = await openDB();
  const transaction = db.transaction(OBJECT_STORE_NAME, "readonly");
  const store = transaction.objectStore(OBJECT_STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const saveStory = async (story) => {
  const db = await openDB();
  const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
  const store = transaction.objectStore(OBJECT_STORE_NAME);

  if (story.photoUrl) {
    cacheImage(story.photoUrl)
      .then((success) => {
        if (success) {
          console.log("Successfully cached image:", story.photoUrl);
        }
      })
      .catch((err) => console.warn("Failed to cache image:", err));
  }

  return new Promise((resolve, reject) => {
    const request = store.put(story);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const deleteStory = async (id) => {
  const db = await openDB();
  const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
  const store = transaction.objectStore(OBJECT_STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export default {
  saveStories,
  getStories,
  getStory,
  saveStory,
  deleteStory,
};
