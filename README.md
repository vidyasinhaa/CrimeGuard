# CrimeGuard: Smart Crime Reporting & Safe Route Analyzer
JIIT Noida | MCA 1st Year 1st Sem | Data Structure Using C Lab (24M15CA111)

## Files
main.c          -> the whole program

locations.txt   -> id name           (places of the city)

roads.txt       -> from to km blocked (blocked: 0 = open, 1 = blocked)

facilities.txt  -> type place name   (1 = police, 2 = hospital, 3 = fire station)

crimes.txt      -> id type place date description


## Run in VS Code
1. File > Open Folder > choose the CrimeGuard folder
2. Open terminal and type:   gcc main.c -o crimeguard
3. Run:   .\crimeguard   (Windows)    or    ./crimeguard   (Linux/Mac)

Risk level: 0-1 crimes = LOW, 2-3 = MEDIUM, 4 or more = HIGH
