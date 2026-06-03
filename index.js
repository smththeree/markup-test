const fromWrap = document.querySelectorAll(".header__inputs-item")[0];
const toWrap = document.querySelectorAll(".header__inputs-item")[1];

const fromBurger = document.querySelectorAll(".burger__field")[0];
const toBurger = document.querySelectorAll(".burger__field")[1];

const burger = document.querySelector(".burger");
const burgerBtn = document.querySelector(".header__burger");
const overlay = document.querySelector(".overlay");

const tabs = document.querySelectorAll(".visability div");
const postsBlock = document.querySelector(".posts");

let currentFilteredPosts = [];

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const type = tab.dataset.type;

    postsBlock.classList.remove("rows", "tiles");
    postsBlock.classList.add(type);
  });
});

burgerBtn.addEventListener("click", () => {
  burger.classList.toggle("active");
  overlay.classList.toggle("active");
  document.body.classList.add("lock");
});

overlay.addEventListener("click", () => {
  burger.classList.remove("active");
  overlay.classList.remove("active");
  document.body.classList.remove("lock");
});

function parseDate(dateString) {
  if (!dateString) return null;

  let match = dateString.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);

  if (!match) {
    match = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  }

  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const year = parseInt(match[3]);
    return new Date(year, month, day);
  }

  return null;
}

function getAllDatesFromPost(post) {
  const dates = [];

  post.items.forEach((item) => {
    if (item.type === "date" && item.title) {
      const parsedDate = parseDate(item.title);
      if (parsedDate) dates.push(parsedDate);
    }
    if (item.type === "upload" && item.date) {
      const parsedDate = parseDate(item.date);
      if (parsedDate) dates.push(parsedDate);
    }
  });

  return dates;
}

function isPostInDateRange(post, fromDate, toDate) {
  const postDates = getAllDatesFromPost(post);

  if (postDates.length === 0) return false;

  return postDates.some((postDate) => {
    if (fromDate && postDate < fromDate) return false;
    if (toDate && postDate > toDate) return false;
    return true;
  });
}

function showNoPostsMessage() {
  const container = document.querySelector(".posts");
  if (!container) return;

  const oldMessage = container.querySelector(".no-posts-message");
  if (oldMessage) oldMessage.remove();

  const messageDiv = document.createElement("div");
  messageDiv.className = "no-posts-message";
  messageDiv.style.cssText = `
    text-align: center;
    padding: 60px 20px;
    color: #999;
    font-size: 18px;
    grid-column: 1 / -1;
    width: 100%;
  `;
  messageDiv.innerHTML = `
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="https://www.w3.org/2000/svg" style="margin: 0 auto 20px; opacity: 0.5;">
      <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M11.9955 13H12.0045M15.9955 13H16.0045M7.99551 13H8.00451" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
   <p>📅 No posts in the selected date range</p>
<p style="font-size: 14px; margin-top: 10px; color: #bbb;">Try selecting different dates</p>
  `;

  container.appendChild(messageDiv);
}

function hideNoPostsMessage() {
  const container = document.querySelector(".posts");
  if (!container) return;

  const message = container.querySelector(".no-posts-message");
  if (message) message.remove();
}

function filterPostsByDate() {
  const fromInput = isMobile() ? fromBurger : fromWrap;
  const toInput = isMobile() ? toBurger : toWrap;

  let fromDateValue = "";
  let toDateValue = "";

  if (fromInput) {
    const input = fromInput.querySelector(".flatpickr-input");
    fromDateValue = input ? input.value : "";
  }

  if (toInput) {
    const input = toInput.querySelector(".flatpickr-input");
    toDateValue = input ? input.value : "";
  }

  let fromDate = null;
  let toDate = null;

  if (fromDateValue) {
    const parts = fromDateValue.split(".");
    if (parts.length === 3) {
      fromDate = new Date(parts[2], parts[1] - 1, parts[0]);
      fromDate.setHours(0, 0, 0, 0);
    }
  }

  if (toDateValue) {
    const parts = toDateValue.split(".");
    if (parts.length === 3) {
      toDate = new Date(parts[2], parts[1] - 1, parts[0]);
      toDate.setHours(23, 59, 59, 999);
    }
  }

  if (fromDate || toDate) {
    currentFilteredPosts = postsData.posts.filter((post) =>
      isPostInDateRange(post, fromDate, toDate),
    );
  } else {
    currentFilteredPosts = [...postsData.posts];
  }

  renderPostsFromJS();
}

function createRange(fromInput, toInput) {
  if (fromInput._flatpickr) fromInput._flatpickr.destroy();
  if (toInput._flatpickr) toInput._flatpickr.destroy();

  const fromPicker = flatpickr(fromInput, {
    wrap: true,
    disableMobile: true,
    dateFormat: "d.m.Y",
    onChange: function (selectedDates, dateStr) {
      if (selectedDates[0]) {
        toPicker.set("minDate", selectedDates[0]);
      }
      filterPostsByDate();
    },
  });

  const toPicker = flatpickr(toInput, {
    wrap: true,
    dateFormat: "d.m.Y",
    disableMobile: true,
    onChange: function (selectedDates, dateStr) {
      if (selectedDates[0]) {
        fromPicker.set("maxDate", selectedDates[0]);
      }
      filterPostsByDate();
    },
  });

  return { fromPicker, toPicker };
}

function isMobile() {
  return window.innerWidth <= 650;
}

let range;

function initDateRange() {
  if (range?.fromPicker) range.fromPicker.destroy();
  if (range?.toPicker) range.toPicker.destroy();

  if (isMobile()) {
    range = createRange(fromBurger, toBurger);
  } else {
    range = createRange(fromWrap, toWrap);
  }
}

initDateRange();
window.addEventListener("resize", () => {
  initDateRange();
});

const postsData = {
  posts: [
    {
      id: "1",
      imageName: "item1",
      items: [
        { type: "date", title: "Today", likes: 128, comments: 31 },
        { type: "date", title: "9-08-2016", likes: 67, comments: 22 },
        { type: "upload", title: "Image upload", date: "11-04-2016" },
      ],
    },
    {
      id: "2",
      imageName: "item2",
      items: [
        { type: "date", title: "Yesterday", likes: 95, comments: 14 },
        { type: "date", title: "15-03-2017", likes: 42, comments: 8 },
        { type: "upload", title: "Image upload", date: "20-05-2017" },
      ],
    },
    {
      id: "3",
      imageName: "item3",
      items: [
        { type: "date", title: "2 hours ago", likes: 203, comments: 56 },
        { type: "date", title: "01-12-2018", likes: 78, comments: 19 },
        { type: "upload", title: "Image upload", date: "10-01-2019" },
      ],
    },
    {
      id: "4",
      imageName: "item4",
      items: [
        { type: "date", title: "22-06-2020", likes: 56, comments: 11 },
        { type: "date", title: "14-02-2019", likes: 112, comments: 34 },
        { type: "upload", title: "Image upload", date: "05-03-2020" },
      ],
    },
    {
      id: "5",
      imageName: "item5",
      items: [
        { type: "date", title: "Last week", likes: 342, comments: 89 },
        { type: "date", title: "03-11-2015", likes: 23, comments: 5 },
        { type: "upload", title: "Image upload", date: "15-07-2015" },
      ],
    },
    {
      id: "6",
      imageName: "item6",
      items: [
        { type: "date", title: "3 days ago", likes: 67, comments: 12 },
        { type: "date", title: "19-09-2021", likes: 156, comments: 44 },
        { type: "upload", title: "Image upload", date: "25-10-2021" },
      ],
    },
    {
      id: "7",
      imageName: "item7",
      items: [
        { type: "date", title: "1 hour ago", likes: 512, comments: 127 },
        { type: "date", title: "07-04-2014", likes: 34, comments: 7 },
        { type: "upload", title: "Image upload", date: "12-05-2014" },
      ],
    },
    {
      id: "8",
      imageName: "item1",
      items: [
        { type: "date", title: "Just now", likes: 89, comments: 23 },
        { type: "date", title: "28-02-2022", likes: 201, comments: 58 },
        { type: "upload", title: "Image upload", date: "10-03-2022" },
      ],
    },
    {
      id: "9",
      imageName: "item2",
      items: [
        { type: "date", title: "5 minutes ago", likes: 45, comments: 8 },
        { type: "date", title: "16-10-2013", likes: 19, comments: 3 },
        { type: "upload", title: "Image upload", date: "22-11-2013" },
      ],
    },
    {
      id: "10",
      imageName: "item3",
      items: [
        { type: "date", title: "Yesterday", likes: 178, comments: 42 },
        { type: "date", title: "04-07-2023", likes: 267, comments: 73 },
        { type: "upload", title: "Image upload", date: "15-08-2023" },
      ],
    },
    {
      id: "11",
      imageName: "item4",
      items: [
        { type: "date", title: "1 week ago", likes: 423, comments: 101 },
        { type: "date", title: "30-12-2022", likes: 88, comments: 21 },
        { type: "upload", title: "Image upload", date: "01-01-2023" },
      ],
    },
    {
      id: "12",
      imageName: "item5",
      items: [
        { type: "date", title: "Today", likes: 301, comments: 82 },
        { type: "date", title: "11-11-2011", likes: 56, comments: 15 },
        { type: "upload", title: "Image upload", date: "11-11-2011" },
      ],
    },
  ],
};

function createPostElement(post) {
  const itemDiv = document.createElement("div");
  itemDiv.className = "posts__item";

  itemDiv.innerHTML = `
    <div class="posts__item-image">
      <img src="./assets/items/${post.imageName}.webp" alt="Post ${post.id} Image" width="86" height="86" loading="lazy" />
    </div>
    <div class="posts__item-content">
      ${post.items
        .map((item) => {
          if (item.type === "date") {
            return `
            <div class="posts__content-date">
              <span class="posts__date-title">${item.title}</span>
              <div class="posts__date-activity">
                <div class="posts__activity-item">
                  <img src="./assets/icons/heart.svg" alt="heart icon" width="18" height="18" loading="lazy" />
                  <span>${item.likes}</span>
                </div>
                <div class="posts__activity-item">
                  <img src="./assets/icons/comment.svg" alt="comment icon" width="18" height="18" loading="lazy" />
                  <span>${item.comments}</span>
                </div>
              </div>
            </div>
          `;
          } else {
            return `
            <div class="posts__content-upload">
              <span class="posts__upload-title">${item.title}</span>
              <span class="posts__upload-date">${item.date}</span>
            </div>
          `;
          }
        })
        .join("")}
    </div>
  `;

  return itemDiv;
}

function loadMore() {
  const container = document.querySelector(".posts");

  if (!container) return;

  const firstThreePosts = currentFilteredPosts.slice(0, 3);

  firstThreePosts.forEach((post) => {
    container.appendChild(createPostElement(post));
  });
}

function renderPostsFromJS() {
  const container = document.querySelector(".posts");
  if (!container) return;

  container.innerHTML = "";

  if (currentFilteredPosts.length === 0) {
    showNoPostsMessage();

    const loadBtn = document.querySelector(".posts__load");
    if (loadBtn) {
      loadBtn.style.display = "none";
    }
  } else {
    hideNoPostsMessage();

    currentFilteredPosts.forEach((post) => {
      container.appendChild(createPostElement(post));
    });

    const loadBtn = document.querySelector(".posts__load");
    if (loadBtn) {
      loadBtn.style.display = "block";

      const newLoadBtn = loadBtn.cloneNode(true);
      loadBtn.parentNode.replaceChild(newLoadBtn, loadBtn);
      newLoadBtn.addEventListener("click", loadMore);
    }
  }
}

currentFilteredPosts = [...postsData.posts];
document.addEventListener("DOMContentLoaded", renderPostsFromJS);
