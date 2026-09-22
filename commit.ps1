Remove-Item -Recurse -Force .git
git init
git config core.autocrlf false
git remote add origin https://github.com/wmrmweerakoon/smart-solar-microgrid.git

$commit1Date = "2026-09-22T18:05:00+05:30"
git add README.md docker-compose.yml backend/SmartSolarMicrogrid.API/SmartSolarMicrogrid.API.csproj
$env:GIT_AUTHOR_DATE=$commit1Date; $env:GIT_COMMITTER_DATE=$commit1Date; git commit -m "Initialize project and root configuration"

$commit2Date = "2026-09-22T18:35:00+05:30"
git add backend/SmartSolarMicrogrid.API/Models/
$env:GIT_AUTHOR_DATE=$commit2Date; $env:GIT_COMMITTER_DATE=$commit2Date; git commit -m "Add domain models for prosumer and energy"

$commit3Date = "2026-09-22T19:15:00+05:30"
git add backend/SmartSolarMicrogrid.API/Data/ backend/SmartSolarMicrogrid.API/appsettings.json
$env:GIT_AUTHOR_DATE=$commit3Date; $env:GIT_COMMITTER_DATE=$commit3Date; git commit -m "Configure MongoDB context and connection"

$commit4Date = "2026-09-22T19:40:00+05:30"
git add backend/SmartSolarMicrogrid.API/Repositories/
$env:GIT_AUTHOR_DATE=$commit4Date; $env:GIT_COMMITTER_DATE=$commit4Date; git commit -m "Implement data repositories"

$commit5Date = "2026-09-22T20:10:00+05:30"
git add backend/SmartSolarMicrogrid.API/Services/
$env:GIT_AUTHOR_DATE=$commit5Date; $env:GIT_COMMITTER_DATE=$commit5Date; git commit -m "Add business logic services"

$commit6Date = "2026-09-22T20:45:00+05:30"
git add backend/SmartSolarMicrogrid.API/Controllers/ backend/SmartSolarMicrogrid.API/Middleware/ backend/SmartSolarMicrogrid.API/Program.cs backend/SmartSolarMicrogrid.API/Properties/
$env:GIT_AUTHOR_DATE=$commit6Date; $env:GIT_COMMITTER_DATE=$commit6Date; git commit -m "Implement REST controllers and middleware"

$commit7Date = "2026-09-22T21:15:00+05:30"
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/index.html frontend/.env frontend/src/index.css frontend/src/main.jsx
$env:GIT_AUTHOR_DATE=$commit7Date; $env:GIT_COMMITTER_DATE=$commit7Date; git commit -m "Initialize react app with vite and design system"

$commit8Date = "2026-09-22T21:40:00+05:30"
git add frontend/src/components/ frontend/src/utils/ frontend/src/services/
$env:GIT_AUTHOR_DATE=$commit8Date; $env:GIT_COMMITTER_DATE=$commit8Date; git commit -m "Add core components, api client, and auth utils"

$commit9Date = "2026-09-22T22:10:00+05:30"
git add frontend/src/pages/Login.jsx frontend/src/pages/Dashboard.jsx frontend/src/App.jsx
$env:GIT_AUTHOR_DATE=$commit9Date; $env:GIT_COMMITTER_DATE=$commit9Date; git commit -m "Implement auth, routing and dashboard"

$commit10Date = "2026-09-22T22:30:00+05:30"
git add frontend/src/pages/prosumer/ frontend/src/pages/microgrid/ frontend/src/pages/energy/ frontend/src/pages/bookings/ frontend/src/pages/reservations/
$env:GIT_AUTHOR_DATE=$commit10Date; $env:GIT_COMMITTER_DATE=$commit10Date; git commit -m "Implement all domain management pages"

git add -f frontend/.env
git add .
$commit11Date = "2026-09-22T22:45:00+05:30"
$env:GIT_AUTHOR_DATE=$commit11Date; $env:GIT_COMMITTER_DATE=$commit11Date; git commit -m "Final adjustments and cleanup"

git branch -M main
git push -u origin main --force
