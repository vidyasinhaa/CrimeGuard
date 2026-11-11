/*
   CrimeGuard: Smart Crime Reporting & Safe Route Analyzer
   JIIT Noida - MCA 1st Year 1st Sem - Data Structure Using C Lab

   The city is a GRAPH:  places = vertices,  roads = edges (with km).

   Data structures used:
     structure     -> Crime, Road, Facility
     array         -> place names, facilities
     linked list   -> crime records and the roads of every place
     queue         -> BFS
     recursion     -> DFS and printing a route
     Dijkstra      -> shortest route / nearest facility / safe route
     searching     -> search crimes by type or place
     sorting       -> bubble sort for hotspots
     files         -> locations.txt, roads.txt, facilities.txt, crimes.txt
*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX 20          /* maximum number of places / facilities */
#define INF 9999        /* means "cannot reach" */
#define PENALTY 20      /* extra km added for a high risk place */

/* ---------------- structures ---------------- */

struct Road {
    int to;                 /* road leads to this place */
    int km;                 /* length of road */
    int blocked;            /* 0 = open, 1 = blocked */
    struct Road *next;      /* next road of the same place */
};

struct Facility {
    int type;               /* 1 = Police, 2 = Hospital, 3 = Fire Station */
    int place;              /* where it is situated */
    char name[40];
};

struct Crime {
    int id;
    int type;               /* 1 to 6 */
    int place;
    char date[15];
    char desc[100];
    struct Crime *next;     /* next crime in the list */
};

/* ---------------- global variables ---------------- */

char placeName[MAX][30];
int numPlaces = 0;

struct Road *roadHead[MAX];         /* roadHead[i] = first road of place i */

struct Facility facility[MAX];
int numFacilities = 0;

struct Crime *head = NULL;          /* first crime of the linked list */
int nextId = 1;                     /* id for the next new crime */

int visited[MAX];                   /* used by DFS */
int dfsCount;

char crimeType[7][15] = {"", "Theft", "Robbery", "Assault", "Harassment", "Vandalism", "Accident"};
char facilityType[4][20] = {"", "Police Station", "Hospital", "Fire Station"};
char riskName[3][10] = {"LOW", "MEDIUM", "HIGH"};

/* ---------------- files ---------------- */

void addRoad(int from, int to, int km, int blocked) {
    struct Road *newRoad = (struct Road *)malloc(sizeof(struct Road));
    newRoad->to = to;
    newRoad->km = km;
    newRoad->blocked = blocked;
    newRoad->next = roadHead[from];     /* new road goes to the front */
    roadHead[from] = newRoad;
}

int loadPlaces() {
    FILE *fp = fopen("locations.txt", "r");
    int id;
    char name[30];

    if (fp == NULL) {
        printf("locations.txt not found! Run the program from the CrimeGuard folder.\n");
        return 0;
    }
    while (numPlaces < MAX && fscanf(fp, "%d %s", &id, name) == 2) {
        strcpy(placeName[id], name);
        numPlaces++;
    }
    fclose(fp);
    return 1;
}

int loadRoads() {
    FILE *fp = fopen("roads.txt", "r");
    int a, b, km, blocked;

    if (fp == NULL) {
        printf("roads.txt not found!\n");
        return 0;
    }
    while (fscanf(fp, "%d %d %d %d", &a, &b, &km, &blocked) == 4) {
        addRoad(a, b, km, blocked);     /* a road works in both directions */
        addRoad(b, a, km, blocked);
    }
    fclose(fp);
    return 1;
}

int loadFacilities() {
    FILE *fp = fopen("facilities.txt", "r");

    if (fp == NULL) {
        printf("facilities.txt not found!\n");
        return 0;
    }
    while (numFacilities < MAX &&
           fscanf(fp, "%d %d %s", &facility[numFacilities].type,
                  &facility[numFacilities].place, facility[numFacilities].name) == 3) {
        numFacilities++;
    }
    fclose(fp);
    return 1;
}

void loadCrimes() {
    FILE *fp = fopen("crimes.txt", "r");
    struct Crime *c;
    struct Crime *last = NULL;

    if (fp == NULL) {
        return;                         /* no file = no crimes yet */
    }

    while (1) {
        c = (struct Crime *)malloc(sizeof(struct Crime));
        if (fscanf(fp, "%d %d %d %s %[^\n]", &c->id, &c->type, &c->place, c->date, c->desc) != 5) {
            free(c);
            break;
        }
        c->next = NULL;
        if (head == NULL) {
            head = c;                   /* first crime */
        } else {
            last->next = c;             /* add at the end */
        }
        last = c;
        if (c->id >= nextId) {
            nextId = c->id + 1;
        }
    }
    fclose(fp);
}

void saveCrimes() {
    FILE *fp = fopen("crimes.txt", "w");
    struct Crime *c;

    for (c = head; c != NULL; c = c->next) {
        fprintf(fp, "%d %d %d %s %s\n", c->id, c->type, c->place, c->date, c->desc);
    }
    fclose(fp);
}

void saveRoads() {
    FILE *fp = fopen("roads.txt", "w");
    struct Road *r;
    int i;

    for (i = 0; i < numPlaces; i++) {
        for (r = roadHead[i]; r != NULL; r = r->next) {
            if (i < r->to) {            /* write each road only once */
                fprintf(fp, "%d %d %d %d\n", i, r->to, r->km, r->blocked);
            }
        }
    }
    fclose(fp);
}

/* ---------------- small helper functions ---------------- */

void showPlaces() {
    int i;
    printf("\nPlaces:\n");
    for (i = 0; i < numPlaces; i++) {
        printf("  %d. %s\n", i, placeName[i]);
    }
}

/* how many crimes happened at this place */
int countCrimes(int place) {
    int count = 0;
    struct Crime *c;
    for (c = head; c != NULL; c = c->next) {
        if (c->place == place) {
            count++;
        }
    }
    return count;
}

/* 0 = LOW (0-1 crimes), 1 = MEDIUM (2-3 crimes), 2 = HIGH (4 or more) */
int riskLevel(int place) {
    int n = countCrimes(place);
    if (n >= 4) {
        return 2;
    }
    if (n >= 2) {
        return 1;
    }
    return 0;
}

void printCrime(struct Crime *c) {
    printf("  ID %d | %s | %s | %s | %s\n", c->id, crimeType[c->type],
           placeName[c->place], c->date, c->desc);
}

/* ---------------- Dijkstra's algorithm ---------------- */

/* Find the not-yet-done place with the smallest distance */
int minPlace(int dist[], int done[]) {
    int i, best = -1;
    for (i = 0; i < numPlaces; i++) {
        if (done[i] == 0 && dist[i] < INF) {
            if (best == -1 || dist[i] < dist[best]) {
                best = i;
            }
        }
    }
    return best;
}

/*
   dist[i] = shortest distance from src to place i
   prev[i] = the place we came from before reaching i
   safe = 0 -> normal shortest route
   safe = 1 -> HIGH risk places get extra PENALTY km, so they are avoided
   Blocked roads are always skipped.
*/
void dijkstra(int src, int safe, int dist[], int prev[]) {
    int done[MAX];
    int i, u, cost;
    struct Road *r;

    for (i = 0; i < numPlaces; i++) {
        dist[i] = INF;
        prev[i] = -1;
        done[i] = 0;
    }
    dist[src] = 0;

    for (i = 0; i < numPlaces; i++) {
        u = minPlace(dist, done);
        if (u == -1) {
            break;                      /* nothing more is reachable */
        }
        done[u] = 1;

        for (r = roadHead[u]; r != NULL; r = r->next) {
            if (r->blocked == 0) {          /* blocked roads are skipped */
                cost = r->km;
                if (safe == 1 && riskLevel(r->to) == 2) {
                    cost = cost + PENALTY;
                }
                if (dist[u] + cost < dist[r->to]) {
                    dist[r->to] = dist[u] + cost;
                    prev[r->to] = u;
                }
            }
        }
    }
}

/* prints the route using recursion */
void printPath(int prev[], int place) {
    if (prev[place] == -1) {
        printf("%s", placeName[place]);
        return;
    }
    printPath(prev, prev[place]);
    printf(" -> %s", placeName[place]);
}

/* real length of the road from a to b */
int roadKm(int a, int b) {
    struct Road *r;
    for (r = roadHead[a]; r != NULL; r = r->next) {
        if (r->to == b) {
            return r->km;
        }
    }
    return 0;
}

/* total km of the route (without penalty) */
int pathKm(int prev[], int dest) {
    int total = 0;
    int p = dest;
    while (prev[p] != -1) {
        total = total + roadKm(prev[p], p);
        p = prev[p];
    }
    return total;
}

/* high risk places between the start and the end of the route */
int countRisky(int prev[], int src, int dest) {
    int count = 0;
    int p = prev[dest];
    while (p != -1 && p != src) {
        if (riskLevel(p) == 2) {
            count++;
        }
        p = prev[p];
    }
    return count;
}

void showRoute(char title[], int prev[], int src, int dest) {
    printf("\n%s\n", title);
    printf("  Route    : ");
    printPath(prev, dest);
    printf("\n  Distance : %d km\n", pathKm(prev, dest));
    printf("  High risk places on the way: %d\n", countRisky(prev, src, dest));
}

/* ---------------- facility search (used by feature 1 and 3) ---------------- */

/* shows facilities of one type within k km, and tells which one is nearest */
void findFacilities(int place, int type, int k) {
    int dist[MAX], prev[MAX];
    int i, found = 0, best = -1;

    dijkstra(place, 0, dist, prev);

    printf("\n%s within %d km of %s:\n", facilityType[type], k, placeName[place]);
    for (i = 0; i < numFacilities; i++) {
        if (facility[i].type == type && dist[facility[i].place] <= k) {
            printf("  %s (at %s) - %d km\n", facility[i].name,
                   placeName[facility[i].place], dist[facility[i].place]);
            found++;
            if (best == -1 || dist[facility[i].place] < dist[facility[best].place]) {
                best = i;
            }
        }
    }
    if (found == 0) {
        printf("  None found (or the roads are blocked).\n");
        return;
    }
    printf("\nNEAREST: %s\n  Route: ", facility[best].name);
    printPath(prev, facility[best].place);
    printf("\n(This is only information. The system does not contact the police.)\n");
}

/* ---------------- 1. Report crime ---------------- */

void reportCrime() {
    struct Crime *c;
    struct Crime *temp;
    int i, type, place, choice;

    printf("\n===== REPORT A CRIME =====\n");
    for (i = 1; i <= 6; i++) {
        printf("  %d. %s\n", i, crimeType[i]);
    }
    printf("Select crime type: ");
    scanf("%d", &type);
    if (type < 1 || type > 6) {
        printf("Invalid crime type!\n");
        return;
    }

    showPlaces();
    printf("Enter place number: ");
    scanf("%d", &place);
    if (place < 0 || place >= numPlaces) {
        printf("Invalid place number!\n");
        return;
    }

    c = (struct Crime *)malloc(sizeof(struct Crime));
    c->id = nextId;
    nextId++;
    c->type = type;
    c->place = place;
    c->next = NULL;

    printf("Enter date (DD-MM-YYYY): ");
    scanf("%s", c->date);

    printf("Enter short description: ");
    scanf(" %[^\n]", c->desc);          /* reads the full line, spaces allowed */

    /* add the new crime at the end of the linked list */
    if (head == NULL) {
        head = c;
    } else {
        temp = head;
        while (temp->next != NULL) {
            temp = temp->next;
        }
        temp->next = c;
    }
    saveCrimes();
    printf("\nCrime saved with ID %d. Risk level of %s is now %s.\n",
           c->id, placeName[c->place], riskName[riskLevel(c->place)]);

    printf("\nFind nearest help from this place?\n");
    printf("  1. Police Station  2. Hospital  3. Fire Station  0. No\n");
    printf("Choice: ");
    scanf("%d", &choice);
    if (choice >= 1 && choice <= 3) {
        findFacilities(c->place, choice, 100);
    }
}

/* ---------------- 2. View and analyze crimes ---------------- */

void viewCrimes() {
    int choice, i, t, p, count;
    struct Crime *c;

    do {
        printf("\n===== CRIME RECORDS =====\n");
        printf("  1. View all crimes\n");
        printf("  2. Search by crime type\n");
        printf("  3. Search by place\n");
        printf("  4. Count of each crime type\n");
        printf("  0. Back\n");
        printf("Choice: ");
        if (scanf("%d", &choice) != 1) {
            break;
        }

        switch (choice) {
            case 1:
                count = 0;
                for (c = head; c != NULL; c = c->next) {
                    printCrime(c);
                    count++;
                }
                printf("Total: %d crime(s)\n", count);
                break;

            case 2:
                for (i = 1; i <= 6; i++) {
                    printf("  %d. %s\n", i, crimeType[i]);
                }
                printf("Enter crime type: ");
                scanf("%d", &t);
                count = 0;
                for (c = head; c != NULL; c = c->next) {
                    if (c->type == t) {
                        printCrime(c);
                        count++;
                    }
                }
                printf("%d crime(s) found.\n", count);
                break;

            case 3:
                showPlaces();
                printf("Enter place number: ");
                scanf("%d", &p);
                count = 0;
                for (c = head; c != NULL; c = c->next) {
                    if (c->place == p) {
                        printCrime(c);
                        count++;
                    }
                }
                printf("%d crime(s) found.\n", count);
                break;

            case 4:
                for (t = 1; t <= 6; t++) {
                    count = 0;
                    for (c = head; c != NULL; c = c->next) {
                        if (c->type == t) {
                            count++;
                        }
                    }
                    printf("  %s : %d\n", crimeType[t], count);
                }
                break;

            case 0:
                break;

            default:
                printf("Invalid choice!\n");
        }
    } while (choice != 0);
}

/* ---------------- 3. Nearby facility ---------------- */

void nearbyFacility() {
    int place, type, k;

    printf("\n===== NEARBY FACILITY FINDER =====\n");
    showPlaces();
    printf("Enter your current place number: ");
    scanf("%d", &place);
    if (place < 0 || place >= numPlaces) {
        printf("Invalid place number!\n");
        return;
    }

    printf("  1. Police Station  2. Hospital  3. Fire Station\n");
    printf("Select facility type: ");
    scanf("%d", &type);
    if (type < 1 || type > 3) {
        printf("Invalid facility type!\n");
        return;
    }

    printf("Search within how many km? ");
    scanf("%d", &k);

    findFacilities(place, type, k);
}

/* ---------------- 4. Safe route ---------------- */

void safeRoute() {
    int dist1[MAX], prev1[MAX];     /* normal shortest route */
    int dist2[MAX], prev2[MAX];     /* safer route */
    int src, dest, risky1, risky2;

    printf("\n===== SAFE ROUTE ANALYZER =====\n");
    showPlaces();
    printf("Enter source place number: ");
    scanf("%d", &src);
    printf("Enter destination place number: ");
    scanf("%d", &dest);

    if (src < 0 || src >= numPlaces || dest < 0 || dest >= numPlaces) {
        printf("Invalid place number!\n");
        return;
    }
    if (src == dest) {
        printf("Source and destination are the same!\n");
        return;
    }

    dijkstra(src, 0, dist1, prev1);
    if (dist1[dest] == INF) {
        printf("\nNo route available. Roads are blocked!\n");
        return;
    }
    showRoute("SHORTEST ROUTE", prev1, src, dest);
    risky1 = countRisky(prev1, src, dest);

    if (risky1 == 0) {
        printf("\nThis route has no high risk place. It is already safe.\n");
        return;
    }

    dijkstra(src, 1, dist2, prev2);
    risky2 = countRisky(prev2, src, dest);

    if (risky2 < risky1) {
        showRoute("SAFER ROUTE", prev2, src, dest);
        printf("\nSafer route is %d km longer but avoids %d high risk place(s).\n",
               pathKm(prev2, dest) - pathKm(prev1, dest), risky1 - risky2);
    } else {
        printf("\nNo safer route is available.\n");
    }
}

/* ---------------- 5. Road block and open ---------------- */

/* sets the road between a and b (both sides). returns 1 if the road exists */
int setRoad(int a, int b, int blocked) {
    struct Road *r;
    int found = 0;

    for (r = roadHead[a]; r != NULL; r = r->next) {
        if (r->to == b) {
            r->blocked = blocked;
            found = 1;
        }
    }
    for (r = roadHead[b]; r != NULL; r = r->next) {
        if (r->to == a) {
            r->blocked = blocked;
        }
    }
    return found;
}

/* asks for two places and blocks (1) or opens (0) the road between them */
void changeRoad(int blocked) {
    int a, b;

    showPlaces();
    printf("Road starts at place number: ");
    scanf("%d", &a);
    printf("Road ends at place number: ");
    scanf("%d", &b);

    if (a < 0 || a >= numPlaces || b < 0 || b >= numPlaces) {
        printf("Invalid place number!\n");
        return;
    }
    if (setRoad(a, b, blocked) == 1) {
        saveRoads();
        printf("Road status updated.\n");
    } else {
        printf("There is no direct road between these two places.\n");
    }
}

void viewRoads() {
    int i;
    struct Road *r;

    for (i = 0; i < numPlaces; i++) {
        for (r = roadHead[i]; r != NULL; r = r->next) {
            if (i < r->to) {
                printf("  %s <-> %s  %d km  ", placeName[i], placeName[r->to], r->km);
                if (r->blocked == 1) {
                    printf("[BLOCKED]\n");
                } else {
                    printf("[OPEN]\n");
                }
            }
        }
    }
}

void roadMenu() {
    int choice;

    do {
        printf("\n===== ROAD STATUS =====\n");
        printf("  1. View all roads\n");
        printf("  2. Block a road\n");
        printf("  3. Open a road\n");
        printf("  0. Back\n");
        printf("Choice: ");
        if (scanf("%d", &choice) != 1) {
            break;
        }

        switch (choice) {
            case 1: viewRoads(); break;
            case 2: changeRoad(1); break;
            case 3: changeRoad(0); break;
            case 0: break;
            default: printf("Invalid choice!\n");
        }
    } while (choice != 0);
}

/* ---------------- 6. Hotspots and connectivity ---------------- */

void showHotspots() {
    int count[MAX], order[MAX];
    int i, j, temp;

    for (i = 0; i < numPlaces; i++) {
        count[i] = countCrimes(i);
        order[i] = i;
    }

    /* bubble sort: place with most crimes comes first */
    for (i = 0; i < numPlaces - 1; i++) {
        for (j = 0; j < numPlaces - 1 - i; j++) {
            if (count[order[j]] < count[order[j + 1]]) {
                temp = order[j];
                order[j] = order[j + 1];
                order[j + 1] = temp;
            }
        }
    }

    printf("\nCrime hotspots (most crimes first):\n");
    for (i = 0; i < numPlaces; i++) {
        printf("  %d. %s - %d crime(s) - %s risk\n", i + 1,
               placeName[order[i]], count[order[i]], riskName[riskLevel(order[i])]);
    }
}

/* BFS uses a queue: visits places level by level */
void bfs(int start) {
    int queue[MAX], level[MAX], seen[MAX];
    int front = 0, rear = 0;
    int i, u;
    struct Road *r;

    for (i = 0; i < numPlaces; i++) {
        seen[i] = 0;
    }

    queue[rear] = start;            /* put start in the queue */
    rear++;
    seen[start] = 1;
    level[start] = 0;

    printf("\nBFS (level wise) from %s:\n", placeName[start]);
    while (front < rear) {
        u = queue[front];           /* take one place out of the queue */
        front++;
        printf("  Level %d : %s\n", level[u], placeName[u]);

        for (r = roadHead[u]; r != NULL; r = r->next) {
            if (r->blocked == 0 && seen[r->to] == 0) {
                seen[r->to] = 1;
                level[r->to] = level[u] + 1;
                queue[rear] = r->to;
                rear++;
            }
        }
    }
    printf("Reachable places: %d out of %d\n", rear, numPlaces);
}

/* DFS uses recursion: goes as deep as possible, then comes back */
void dfs(int u) {
    struct Road *r;

    visited[u] = 1;
    dfsCount++;
    printf("%s", placeName[u]);

    for (r = roadHead[u]; r != NULL; r = r->next) {
        if (r->blocked == 0 && visited[r->to] == 0) {
            printf(" -> ");
            dfs(r->to);
        }
    }
}

void connectivity() {
    int start, i;

    showPlaces();
    printf("Start from place number: ");
    scanf("%d", &start);
    if (start < 0 || start >= numPlaces) {
        printf("Invalid place number!\n");
        return;
    }

    bfs(start);

    for (i = 0; i < numPlaces; i++) {
        visited[i] = 0;
    }
    dfsCount = 0;
    printf("\nDFS (deep) from %s:\n  ", placeName[start]);
    dfs(start);
    printf("\nReachable places: %d out of %d\n", dfsCount, numPlaces);

    if (dfsCount < numPlaces) {
        printf("Not reachable (blocked roads): ");
        for (i = 0; i < numPlaces; i++) {
            if (visited[i] == 0) {
                printf("[%s] ", placeName[i]);
            }
        }
        printf("\n");
    }
}

void hotspotMenu() {
    int choice;

    do {
        printf("\n===== HOTSPOT & CONNECTIVITY =====\n");
        printf("  1. View crime hotspots\n");
        printf("  2. Connectivity (BFS and DFS)\n");
        printf("  0. Back\n");
        printf("Choice: ");
        if (scanf("%d", &choice) != 1) {
            break;
        }

        switch (choice) {
            case 1: showHotspots(); break;
            case 2: connectivity(); break;
            case 0: break;
            default: printf("Invalid choice!\n");
        }
    } while (choice != 0);
}

/* ---------------- main ---------------- */

int main() {
    int choice, i;

    for (i = 0; i < MAX; i++) {
        roadHead[i] = NULL;
    }

    /* if any file is missing, the loader prints a message and we stop */
    if (loadPlaces() == 0 || loadRoads() == 0 || loadFacilities() == 0) {
        return 0;
    }
    loadCrimes();

    printf("=====================================================\n");
    printf("  CrimeGuard: Smart Crime Reporting & Safe Route Analyzer\n");
    printf("=====================================================\n");

    do {
        printf("\n========== MAIN MENU ==========\n");
        printf("  1. Report a crime\n");
        printf("  2. Crime records\n");
        printf("  3. Nearby police / emergency facility\n");
        printf("  4. Safe route analyzer\n");
        printf("  5. Road status (block / open)\n");
        printf("  6. Hotspots & connectivity\n");
        printf("  0. Exit\n");
        printf("Enter your choice: ");
        if (scanf("%d", &choice) != 1) {    /* letters typed: stop program */
            break;
        }

        switch (choice) {
            case 1: 
                reportCrime(); 
                break;
            case 2: 
                viewCrimes(); 
                break;
            case 3: 
                nearbyFacility(); 
                break;
            case 4: 
                safeRoute(); 
                break;
            case 5: 
                roadMenu();
                break;
            case 6: 
                hotspotMenu(); 
                break;
            case 0: 
                break;
            default: 
                printf("Invalid choice!\n");
        }
    } while (choice != 0);

    printf("\nThank you for using CrimeGuard. Stay safe!\n");
    return 0;
}