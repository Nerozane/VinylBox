// Shared vinyl collection data — used by catalog.js and home.js.

const VINYL_STORAGE_KEY = "vinylBoxRecordsV2";
const VINYL_LEGACY_KEY = "vinylVaultRecords";
const DEFAULT_COVER = "images/default-cover.svg";

const defaultVinyls = [
  {
    id: 1,
    title: "Thriller",
    artist: "Michael Jackson",
    year: 1982,
    genre: "Pop",
    label: "Epic",
    photoFront: "images/ThrillerFront.jpg",
    photoBack: "images/ThrillerRear.jpg",
    songs: [
      { title: "Wanna Be Startin' Somethin'", bpm: null },
      { title: "Baby Be Mine", bpm: null },
      { title: "The Girl Is Mine", bpm: null },
      { title: "Thriller", bpm: null },
      { title: "Beat It", bpm: null },
      { title: "Billie Jean", bpm: null },
      { title: "Human Nature", bpm: null },
      { title: "P.Y.T. (Pretty Young Thing)", bpm: null },
      { title: "The Lady In My Life", bpm: null },
    ],
  },
  {
    id: 2,
    title: "Blue Monday 1988",
    artist: "New Order",
    year: 1988,
    genre: "Electronic",
    label: "Factory",
    photoFront: "images/NewOrderFront.jpg",
    photoBack: "images/NewOrderRear.jpg",
    songs: [
      { title: "Blue Monday 1988", bpm: null },
      { title: "Beach Buggy", bpm: null },
    ],
  },
  {
    id: 3,
    title: "Homework",
    artist: "Daft Punk",
    year: 1997,
    genre: "Electronic",
    label: "Virgin",
    photoFront: "images/HomeworkFront.jpg",
    photoBack: "images/HomeworkRear.jpg",
    songs: [
      { title: "Da Funk", bpm: null },
      { title: "Around The World", bpm: null },
      { title: "Revolution 909", bpm: null },
      { title: "Burnin'", bpm: null },
      { title: "Alive", bpm: null },
    ],
  },
  {
    id: 4,
    title: "House Music Will Never Die",
    artist: "Glenn Underground",
    year: 1996,
    genre: "House",
    label: "Groovin Recordings",
    photoFront: "images/GlenUndergroundFront.jpg",
    photoBack: "images/GlenUndergroundRear.jpg",
    songs: [
      { title: "GU's Cei-Bei Foot Mix", bpm: null },
      { title: "C.V.O.'s Bismark Hotel Mix", bpm: null },
      { title: "Mark Grant's Paramount Room Mix", bpm: null },
      { title: "Glenn's Afro Dub", bpm: null },
    ],
  },
  {
    id: 5,
    title: "Discovery",
    artist: "Daft Punk",
    year: 2001,
    genre: "Electronic",
    label: "Virgin",
    photoFront: "images/DiscoveryFront.jpg",
    photoBack: "images/DiscoveryRear.jpg",
    songs: [
      { title: "One More Time", bpm: null },
      { title: "Harder, Better, Faster, Stronger", bpm: null },
      { title: "Digital Love", bpm: null },
      { title: "Something About Us", bpm: null },
      { title: "Voyager", bpm: null },
    ],
  },
  {
    id: 6,
    title: "The Hustler EP",
    artist: "Demarkus Lewis",
    year: 2004,
    genre: "House",
    label: "Vista Recordings",
    photoFront: "images/DemarkusLewisFront.jpg",
    photoBack: "images/DemarkusLewisRear.jpg",
    songs: [
      { title: "Hustler", bpm: null },
      { title: "Frequency In Motion", bpm: null },
      { title: "I'm a Freak", bpm: null },
    ],
  },
  {
    id: 7,
    title: "Doctor Pressure",
    artist: "Mylo vs Miami Sound Machine",
    year: 2005,
    genre: "House",
    label: "Breastfed",
    photoFront: "images/DoctorPressureFront.jpg",
    photoBack: "images/DoctorPressureRear.jpg",
    songs: [
      { title: "Doctor Pressure (Dirty Club Mix)", bpm: null },
      { title: "Drop The Pressure (Club Mix)", bpm: null },
      { title: "Drop The Pressure (Rex The Dog Remix)", bpm: null },
      { title: "Drop The Pressure (Stanton Warriors Remix)", bpm: null },
    ],
  },
  {
    id: 8,
    title: "Bar A Thym",
    artist: "Kerri Chandler",
    year: 2000,
    genre: "House",
    label: "King Street Sounds",
    photoFront: "images/KerriChandlerFront.jpg",
    photoBack: "images/KerriChandlerRear.jpg",
    songs: [
      { title: "Bar A Thym", bpm: null },
      { title: "Bar A Thym (Foremost Poets Vocal Edit)", bpm: null },
      { title: "Bar A Thym (THEMBA Remix)", bpm: null },
    ],
  },
  {
    id: 9,
    title: "Random Access Memories",
    artist: "Daft Punk",
    year: 2013,
    genre: "Electronic",
    label: "Columbia",
    photoFront: "images/R.A.MFront.jpg",
    photoBack: "images/R.A.MRear.jpg",
    songs: [
      { title: "Give Life Back to Music", bpm: 110 },
      { title: "Instant Crush", bpm: null },
      { title: "Get Lucky", bpm: 116 },
      { title: "Lose Yourself to Dance", bpm: null },
      { title: "Contact", bpm: null },
    ],
  },
];

const loadVinylRecords = () => {
  let raw = window.localStorage.getItem(VINYL_STORAGE_KEY);
  if (!raw) {
    raw = window.localStorage.getItem(VINYL_LEGACY_KEY);
  }
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (err) {
      return JSON.parse(JSON.stringify(defaultVinyls));
    }
  }
  return JSON.parse(JSON.stringify(defaultVinyls));
};

const getFrontCoverUrl = (record) => {
  if (record.photoFront && record.photoFront.trim() !== "") {
    return record.photoFront.trim();
  }
  return DEFAULT_COVER;
};

const escapeHtmlValue = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const VinylData = {
  STORAGE_KEY: VINYL_STORAGE_KEY,
  LEGACY_STORAGE_KEY: VINYL_LEGACY_KEY,
  starterVinyls: defaultVinyls,
  loadRecords: loadVinylRecords,
  frontCoverUrl: getFrontCoverUrl,
  escapeHtml: escapeHtmlValue,
};
