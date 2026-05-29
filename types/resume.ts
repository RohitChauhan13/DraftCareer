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
export type ThemeId = "purple" | "charcoal" | "taupe" | "navy" | "blue" | "teal" | "green" | "orange" | "red";
export type ResumeTextColorKey = "name" | "description" | "subtitle" | "meta";
export type ResumeTextColors = Partial<Record<ResumeTextColorKey, string>>;
export type ResumeInitialsShape = "square" | "round";
export type ResumeInitialsPosition = "left" | "center" | "right";
export type ResumeInitialsStyle = {
  letterColor?: string;
  boxColor?: string;
  shape?: ResumeInitialsShape;
  position?: ResumeInitialsPosition;
  image?: string;
};

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
  textColors: ResumeTextColors;
  initialsStyle: ResumeInitialsStyle;
  personal: PersonalInfo;
  summary: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: Certification[];
  achievements: Achievement[];
};
