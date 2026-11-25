# Movies-Explorer
A modern, responsive movie discovery website built with HTML, CSS, and vanilla JavaScript. Uses AJAX and the OMDb REST API to search movies, explore details, filter results, and navigate pages.
## About the Project

Movies-Explorer is a website I created to make it easier for users to search for movies and TV series and explore information about them. I wanted to build something simple, useful, and easy to navigate.

The website gets its information from the OMDb API. When a user searches for a title, the website sends a request to the API and displays the results without refreshing the page.

## Features

The website includes the following features:

- Search for movies, TV series, and episodes by title.
- View movie posters and search results.
- Open a title to see more detailed information.
- Filter search results by Movies, Series, or Episodes.
- Browse more results using the pagination controls.
- See loading messages while the website retrieves information.
- Get helpful messages when no results are found or something goes wrong.
- Use a modern, dark-themed design that works on different screen sizes.

## Technologies I Used

For this project, I used:

- **HTML** to build the structure of the website.
- **CSS** to create the design and layout.
- **JavaScript** to make the website interactive.
- **AJAX and Fetch API** to retrieve information without reloading the page.
- **OMDb API** to get movie and TV series information.
- **Netlify Functions** to handle API requests securely.
- **GitHub** to store and manage my project code.
- **Netlify** to publish the website online.

## How the Website Works

When someone enters a movie or series name in the search box, JavaScript sends a request to a Netlify Function. The function then contacts the OMDb API and sends the information back to the website.

The results are displayed as movie cards with posters. Users can also choose a content type, open a title to see more information, and move between pages to explore additional results.

I also stored my API key as an environment variable in Netlify instead of placing it directly in the frontend code.

## How to Use

1. Open the website using the live link below.
2. Enter the name of a movie or TV series in the search box.
3. Submit your search to see the results.
4. Use the filter to choose Movies, Series, or Episodes.
5. Select a result to view more information.
6. Use the pagination controls to see more results.

## Project Files

```text
Movies-Explorer/
├── index.html
├── style.css
├── script.js
├── README.md
├── .gitignore
├── netlify.toml
└── netlify/
    └── functions/
        └── movies.mjs
```

## Live Website

https://movies-explorer-1cga.netlify.app

## GitHub Repository

https://github.com/chaudharysatyandrakumar-boop/Movies-Explorer

## What I Learned

While working on this project, I learned how to connect a website to a live API and retrieve information using JavaScript. I also got more practice with asynchronous requests, handling API responses, updating webpage content dynamically, and using event listeners.

I also learned how to use GitHub to manage my code and Netlify to deploy a website. One of the challenges was getting the API connection and environment variable working correctly. Solving this helped me understand how frontend code can communicate with a backend function.

Overall, this project gave me a better understanding of how interactive websites use external APIs to display live information.

## My Self-Assessment

I believe I have successfully completed the main goals of this project. The website uses