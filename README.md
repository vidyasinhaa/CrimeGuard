# CrimeGuard: Smart Crime Reporting & Safe Route Analyzer
JIIT Noida | MCA 1st Year 1st Sem | Data Structure Using C Lab (24M15CA111)

## Part 1: Console program (C)
Files
  main.c          -> the whole program
  locations.txt   -> id name           (places of the city)
  roads.txt       -> from to km blocked (blocked: 0 = open, 1 = blocked)
  facilities.txt  -> type place name   (1 = police, 2 = hospital, 3 = fire station)
  crimes.txt      -> id type place date description

Run in VS Code
  1. File > Open Folder > choose the CrimeGuard folder
  2. Open terminal and type:   gcc main.c -o crimeguard
  3. Run:   .\crimeguard   (Windows)    or    ./crimeguard   (Linux/Mac)

## Part 2: Web interface (HTML, CSS, JavaScript)
Files (inside the ui folder)
  index.html  -> the page (tabs, forms, map area)
  style.css   -> colours and layout
  data.js     -> starting data of the city (same as the txt files)
  script.js   -> all the logic (Dijkstra, BFS, DFS, risk levels, sorting)

Run
  Double click ui/index.html (opens in Chrome or Edge).
  Or in VS Code: right click index.html > Open with Live Server (if installed).

The web version saves your changes in the browser (localStorage).
Use "Download crimes.txt" / "Download roads.txt" to get files in the same format as the C program.

Risk level: 0-1 crimes = LOW, 2-3 = MEDIUM, 4 or more = HIGH
