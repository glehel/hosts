@echo on

set "BRANCH=gh-pages"

echo "Clean all git commit"
git checkout --orphan latest_branch
git add -A
git commit -am "Delete all previous commit"
git branch -D "%BRANCH%"
git branch -m "%BRANCH%"

echo "Cleanup refs and logs"
rm -Rf .git/refs/original
rm -Rf .git/logs/

echo "Cleanup unnecessary files"
git gc --aggressive --prune=now

echo "Prune all unreachable objects"
git prune --expire now

::git push -f origin "%BRANCH%"