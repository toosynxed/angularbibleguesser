# How to import these pages into your GitHub Wiki

Copy the markdown files from this `wiki/` folder into your GitHub wiki repo (do **not** need to copy this helper file).

## Recommended — clone the wiki and copy

```bash
git clone https://github.com/YOUR_USER/YOUR_REPO.wiki.git
cd YOUR_REPO.wiki

cp /path/to/angularbibleguesser/wiki/*.md .
rm -f HOW_TO_IMPORT.md

git add *.md
git commit -m "Add Better Bible Guesser game wiki"
git push
```

## Notes

* `Home.md` is the wiki landing page
* `_Sidebar.md` is the left navigation
* `_Footer.md` appears at the bottom of pages
* Wiki pages are flat — keep these filenames as-is
