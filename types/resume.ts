export type TemplateId =
  | "modern"
  | "ats"
  | "minimal"
  | "developer"
  | "classic"
  | "executive"
  | "timeline"
  | "compact"
  | "editorial"
  | "accent"
  | "split"
  | "mono";
export type ThemeId = "white" | "charcoal" | "taupe" | "navy" | "blue" | "teal" | "green" | "orange" | "red";

export type PersonalInfo = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
};

export type Education = {
  college: string;
  degree: string;
  cgpa: string;
  startDate: string;
  endDate: string;
};

export type Experience = {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

export type Project = {
  name: string;
  description: string;
  technologies: string;
  github: string;
  live: string;
};

export type Certification = {
  name: string;
  provider: string;
  date: string;
};

export type Achievement = {
  title: string;
  description: string;
};

export type ResumeData = {
  title: string;
  templateId: TemplateId;
  themeId: ThemeId;
  personal: PersonalInfo;
  summary: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: Certification[];
  achievements: Achievement[];
};
