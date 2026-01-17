export interface Startup {
  id: string;
  name: string;
  logo: string | null;
  about: string;
  industries: string[];
  founded: number;
  work_mode: "Remote" | "Hybrid" | "On-site";

  founders: {
    name: string;
    title: string;
    linkedin: string | null;
  }[];

  funding: {
    stage: string;
    total: number;
    valuation: number | null;
  };

  investors: string[];
  benefits: string[];

  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };

  team_size: string;

  jobs: {
    total: number;
    url: string | null;
    positions: {
      id: string;
      title: string;
      department: string;
      description: string;
      location: string;
      work_type: "Remote" | "Hybrid" | "On-site";
    }[];
  };

  updated_at: string;
}
