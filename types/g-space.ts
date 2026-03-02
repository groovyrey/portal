export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  updated: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'class' | 'payment' | 'assignment';
  date: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  amount?: string;
  description?: string;
  color?: string;
  course?: string;
  link?: string;
}

export interface ClassroomAssignment {
  id: string;
  courseName: string;
  title: string;
  description?: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours: number;
    minutes: number;
  };
  alternateLink: string;
  state: string;
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  alternateLink: string;
  ownerName?: string;
}

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail: string;
    };
    previewLink: string;
    publishedDate?: string;
  };
}

export interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    channelTitle: string;
    publishTime: string;
  };
  contentDetails?: {
    duration: string;
    caption?: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
  };
  topicDetails?: {
    topicCategories?: string[];
  };
}
