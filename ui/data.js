/*
   data.js - the starting data of the city.
   This is the same data that is inside the .txt files of the C program
   (locations.txt, roads.txt, facilities.txt, crimes.txt).
*/

/* locations.txt : the place number is the position in this list */
var placeNames = [
    "JIIT Sector 62",       /* 0 */
    "Sector 62 Market",     /* 1 */
    "Noida City Centre",    /* 2 */
    "Botanical Garden",     /* 3 */
    "Sector 18 Market",     /* 4 */
    "Film City",            /* 5 */
    "Sector 137",           /* 6 */
    "Sector 15",            /* 7 */
    "Kalindi Kunj",         /* 8 */
    "Sector 50"             /* 9 */
];

/* position of every place on the map (x and y). Only used for drawing. */
var placeX = [60, 160, 165, 350, 330, 520, 540, 280, 390, 450];
var placeY = [200, 90, 250, 220, 75, 110, 270, 335, 395, 350];

/* roads.txt : a and b are place numbers, km is the length, blocked 0 = open, 1 = blocked */
var sampleRoads = [
    { a: 0, b: 1, km: 2, blocked: 0 },
    { a: 0, b: 2, km: 5, blocked: 0 },
    { a: 1, b: 2, km: 3, blocked: 0 },
    { a: 1, b: 4, km: 6, blocked: 0 },
    { a: 2, b: 3, km: 4, blocked: 0 },
    { a: 2, b: 7, km: 5, blocked: 0 },
    { a: 3, b: 4, km: 3, blocked: 0 },
    { a: 3, b: 5, km: 7, blocked: 0 },
    { a: 3, b: 6, km: 9, blocked: 0 },
    { a: 4, b: 5, km: 5, blocked: 0 },
    { a: 4, b: 7, km: 4, blocked: 0 },
    { a: 5, b: 6, km: 6, blocked: 0 },
    { a: 6, b: 9, km: 8, blocked: 0 },
    { a: 7, b: 8, km: 6, blocked: 0 },
    { a: 7, b: 9, km: 7, blocked: 0 },
    { a: 8, b: 9, km: 5, blocked: 0 }
];

/* facilities.txt : type 1 = Police, 2 = Hospital, 3 = Fire Station */
var facilities = [
    { type: 1, place: 1, name: "Sector 62 Police Station" },
    { type: 1, place: 4, name: "Sector 18 Police Post" },
    { type: 1, place: 7, name: "Sector 15 Police Station" },
    { type: 1, place: 9, name: "Sector 50 Police Station" },
    { type: 2, place: 2, name: "City Hospital" },
    { type: 2, place: 6, name: "Sector 137 Hospital" },
    { type: 2, place: 8, name: "Kalindi Hospital" },
    { type: 3, place: 3, name: "Botanical Fire Station" },
    { type: 3, place: 5, name: "Film City Fire Station" }
];

/* crimes.txt : type 1 Theft, 2 Robbery, 3 Assault, 4 Harassment, 5 Vandalism, 6 Accident */
var sampleCrimes = [
    { id: 1,  type: 1, place: 4, date: "02-10-2026", desc: "Mobile phone snatched near market gate" },
    { id: 2,  type: 2, place: 4, date: "05-10-2026", desc: "Bag robbery at knifepoint in evening" },
    { id: 3,  type: 1, place: 4, date: "09-10-2026", desc: "Wallet stolen in crowded lane" },
    { id: 4,  type: 4, place: 4, date: "12-10-2026", desc: "Eve teasing near bus stop" },
    { id: 5,  type: 3, place: 4, date: "15-10-2026", desc: "Fight outside shop" },
    { id: 6,  type: 1, place: 3, date: "03-10-2026", desc: "Bike stolen from parking" },
    { id: 7,  type: 5, place: 3, date: "08-10-2026", desc: "Park bench and lights damaged" },
    { id: 8,  type: 2, place: 3, date: "11-10-2026", desc: "Chain snatching in garden" },
    { id: 9,  type: 4, place: 3, date: "20-10-2026", desc: "Harassment near entrance" },
    { id: 10, type: 1, place: 2, date: "06-10-2026", desc: "Laptop stolen from car" },
    { id: 11, type: 3, place: 2, date: "14-10-2026", desc: "Assault outside mall" },
    { id: 12, type: 6, place: 2, date: "18-10-2026", desc: "Road accident near signal" },
    { id: 13, type: 1, place: 7, date: "07-10-2026", desc: "Purse stolen" },
    { id: 14, type: 5, place: 7, date: "22-10-2026", desc: "Shop shutter damaged" },
    { id: 15, type: 1, place: 5, date: "10-10-2026", desc: "Camera equipment stolen" },
    { id: 16, type: 6, place: 5, date: "25-10-2026", desc: "Minor collision" },
    { id: 17, type: 4, place: 1, date: "13-10-2026", desc: "Verbal harassment near tea stall" },
    { id: 18, type: 1, place: 8, date: "28-10-2026", desc: "Cycle stolen" }
];
