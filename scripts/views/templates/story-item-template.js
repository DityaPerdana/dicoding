const createStoryItemTemplate = (story) => {
  const dateObject = new Date(story.createdAt);
  const formattedDate = dateObject.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <article class="story-item" data-story-id="${story.id}">
      <img src="${story.photoUrl}" alt="Photo by ${story.name}" class="story-item__image">
      <div class="story-item__content">
        <h3 class="story-item__title">${story.name}'s Story</h3>
        <p class="story-item__description">${story.description}</p>
        <p class="story-item__date">${formattedDate}</p>
        ${story.lat && story.lon ? `<p class="story-item__location">Location available</p>` : ""}
      </div>
    </article>
  `;
};

export default { createStoryItemTemplate };
