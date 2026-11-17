export type Job = {
  title: string;
  year: number;
};

export type Company = {
  id: string;
  name: string;
  lng: number;
  lat: number;
  jobs: Job[];
};

export const companies: Company[] = [
  {
    id: "1",
    name: "TechNova Solutions",
    lng: 72.5714,
    lat: 23.0225,
    jobs: [
      { title: "Frontend Engineer", year: 2024 },
      { title: "Backend Engineer", year: 2023 }
    ]
  },
  {
    id: "2",
    name: "CloudEdge Systems",
    lng: 72.8311,
    lat: 21.1702,
    jobs: [
      { title: "DevOps Engineer", year: 2024 },
      { title: "SRE", year: 2022 }
    ]
  },
  {
    id: "3",
    name: "DataWave Labs",
    lng: 73.1812,
    lat: 22.3072,
    jobs: [
      { title: "Data Scientist", year: 2024 },
      { title: "ML Engineer", year: 2023 }
    ]
  }
];
