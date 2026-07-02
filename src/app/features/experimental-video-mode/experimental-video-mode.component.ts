import { Component } from '@angular/core';

interface VideoLesson {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  relatedRoute: string;
}

@Component({
  selector: 'app-experimental-video-mode',
  templateUrl: './experimental-video-mode.component.html',
  styleUrls: ['./experimental-video-mode.component.css']
})
export class ExperimentalVideoModeComponent {
  selectedLesson: VideoLesson;

  readonly lessons: VideoLesson[] = [
    {
      id: 'gospels-context',
      title: 'Gospel Context Warm-up',
      summary: 'Watch a short learning segment, then play rounds focused on Gospel passages.',
      sourceUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      relatedRoute: '/game'
    },
    {
      id: 'psalms-poetry',
      title: 'Psalms and Poetry',
      summary: 'A placeholder lesson for pairing educational video content with verse guessing.',
      sourceUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      relatedRoute: '/custom-settings'
    }
  ];

  constructor() {
    this.selectedLesson = this.lessons[0];
  }

  selectLesson(lesson: VideoLesson): void {
    this.selectedLesson = lesson;
  }
}
