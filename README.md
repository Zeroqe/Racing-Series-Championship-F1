# Vite + SCSS Web Starter Template

A clean, lightweight boilerplate for responsive multi-page websites powered by **Vite** and **Sass (SCSS)**.

## Project Structure

```text
├── src/
│   ├── font/                  # Local web fonts
│   ├── img/                   # Images and raster assets
│   ├── js/
│   │   └── script.js          # Main JavaScript entry point
│   ├── logo/                  # Brand logos and SVG assets
│   └── sass/
│       ├── base/              # Global variables, mixins, and base styles
│       ├── blocks/            # Component and section styles
│       ├── libs/
│       │   └── modern-normalize.min.css
│       ├── pxtorem.scss       # Custom px-to-rem conversion function
│       └── style.scss         # Main stylesheet
├── .gitignore
├── index.html                 # Main HTML entry point
├── package.json
├── package-lock.json
└── vite.config.js             # Vite & Rollup multi-page configuration
```

## Getting Started

1. Click **Use this template** → **Create a new repository** on GitHub.
2. Clone your new repository and install dependencies:
   ```bash
   git clone [https://github.com/Zeroqe/](https://github.com/Zeroqe/)<your-repo-name>.git
   cd <your-repo-name>
   npm i
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```

## Available Scripts

| Command           | Description                                                    |
| :---------------- | :------------------------------------------------------------- |
| `npm run dev`     | Starts the Vite dev server with Hot Module Replacement (HMR)   |
| `npm run build`   | Compiles and bundles production assets into the `dist/` folder |
| `npm run preview` | Locally previews the production build from `dist/`             |

## Dependency Maintenance

Check for outdated packages:

```bash
npm outdated
```

Update **Vite** to the latest version:

```bash
npm i -D vite@latest
```

Update **all dependencies** in `package.json` (including major versions):

```bash
npx npm-check-updates -u
npm i
```

## Built-in Helpers

- **`px` to `rem` conversion:** Import the helper at the top of any `.scss` file with `@use "pxtorem" as *;` and pass unitless pixel values (e.g., `font-size: rem(18);`).
- **Multi-page builds:** When adding new HTML pages (e.g., `about.html`), register them inside `build.rollupOptions.input` in `vite.config.js`.
