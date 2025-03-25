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
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const saveStories = async (stories) => {
  const db = await openDB();
  const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
  const store = transaction.objectStore(OBJECT_STORE_NAME);

  stories.forEach((story) => {
    store.put(story);
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
  const db = await openDB();
  const transaction = db.transaction(OBJECT_STORE_NAME, "readonly");
  const store = transaction.objectStore(OBJECT_STORE_NAME);
  const index = store.index("createdAt");

  return new Promise((resolve, reject) => {
    const request = index.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
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
