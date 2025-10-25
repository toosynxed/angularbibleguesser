import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef, AfterViewInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-scroll-picker',
  templateUrl: './scroll-picker.component.html',
  styleUrls: ['./scroll-picker.component.css']
})
export class ScrollPickerComponent implements OnChanges, AfterViewInit {
  @Input() items: (string | number)[] = [];
  @Output() selectedChange = new EventEmitter<string | number>();

  listTop = 0;
  selectedIndex = 0;
  itemHeight = 40; // Corresponds to the height in CSS
  private isPanning = false;
  private panStartY = 0;
  private lastPanY = 0;
  private panVelocity = 0;
  private animationFrameId: number;

  // For mouse dragging
  private isDragging = false;
  private dragStartTop = 0;
  private dragStartY = 0;
  private lastDragY = 0;

  private readonly SCROLL_SENSITIVITY = 0.2;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    // Center the initial item
    this.snapTo(0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      // When items change (e.g., chapters for a new book), reset to the first item.
      this.selectedIndex = 0;
      this.snapTo(0);
      if (this.items.length > 0) {
        this.emitSelection();
      }
    }
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    // Reduce sensitivity for smoother mouse wheel scrolling
    const newTop = this.listTop - (event.deltaY * this.SCROLL_SENSITIVITY);
    this.listTop = this.clampTop(newTop);
    this.updateSelectedIndexFromTop();
    this.snapTo(this.selectedIndex);
  }

  onPanStart(event: any): void {
    cancelAnimationFrame(this.animationFrameId);
    event.preventDefault();
    this.isPanning = true;
    this.panStartY = this.listTop;
    this.lastPanY = event.deltaY;
    this.panVelocity = 0;
    this.el.nativeElement.querySelector('.scroll-picker-list').style.transition = 'none';
  }

  onPanMove(event: any): void {
    if (!this.isPanning) return;
    event.preventDefault();

    // Calculate velocity for flick gesture
    const delta = event.deltaY - this.lastPanY;
    this.panVelocity = delta;
    this.lastPanY = event.deltaY;

    const newTop = this.panStartY + event.deltaY;
    this.listTop = this.clampTop(newTop);
    this.updateSelectedIndexFromTop();
  }

  onPanEnd(event: any): void {
    if (!this.isPanning) return;
    event.preventDefault();
    this.isPanning = false;
    this.el.nativeElement.querySelector('.scroll-picker-list').style.transition = '';

    // Start momentum scroll if velocity is high enough
    if (Math.abs(this.panVelocity) > 1) {
      this.momentumScroll();
    } else {
      this.snapTo(this.selectedIndex);
    }
  }

  // --- Mouse Dragging Handlers ---

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    event.preventDefault();

    const delta = event.clientY - this.lastDragY;
    this.panVelocity = delta;
    this.lastDragY = event.clientY;

    const newTop = this.dragStartTop + (event.clientY - this.dragStartY);
    this.listTop = this.clampTop(newTop);
    this.updateSelectedIndexFromTop();
  }

  @HostListener('window:mouseup', ['$event'])
  onWindowMouseUp(event: MouseEvent) {
    if (!this.isDragging) return;
    event.preventDefault();
    this.isDragging = false;
    this.el.nativeElement.querySelector('.scroll-picker-list').style.transition = '';

    if (Math.abs(this.panVelocity) > 1) {
      this.momentumScroll();
    } else {
      this.snapTo(this.selectedIndex);
    }
  }

  onMouseDown(event: MouseEvent) {
    cancelAnimationFrame(this.animationFrameId);
    event.preventDefault();
    this.isDragging = true;
    this.dragStartTop = this.listTop;
    this.dragStartY = this.lastDragY = event.clientY;
    this.panVelocity = 0;
    this.el.nativeElement.querySelector('.scroll-picker-list').style.transition = 'none';
  }

  // --- Touch Handlers ---

  onTouchStart(event: TouchEvent) {
    cancelAnimationFrame(this.animationFrameId);
    event.preventDefault();
    this.isDragging = true;
    this.dragStartTop = this.listTop;
    this.dragStartY = this.lastDragY = event.touches[0].clientY;
    this.panVelocity = 0;
    this.el.nativeElement.querySelector('.scroll-picker-list').style.transition = 'none';
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;
    event.preventDefault();

    const delta = event.touches[0].clientY - this.lastDragY;
    this.panVelocity = delta;
    this.lastDragY = event.touches[0].clientY;

    const newTop = this.dragStartTop + (event.touches[0].clientY - this.dragStartY);
    this.listTop = this.clampTop(newTop);
    this.updateSelectedIndexFromTop();
  }

  onMouseUp(event: MouseEvent | TouchEvent) {
    // This method is called by touchend and simply delegates to the mouseup handler
    this.onWindowMouseUp(event as MouseEvent);
  }

  private momentumScroll(): void {
    this.listTop = this.clampTop(this.listTop + this.panVelocity);
    this.panVelocity *= 0.95; // Friction

    this.updateSelectedIndexFromTop();

    if (Math.abs(this.panVelocity) > 0.5) {
      this.animationFrameId = requestAnimationFrame(() => this.momentumScroll());
    } else {
      this.snapTo(this.selectedIndex);
    }
  }

  private updateSelectedIndexFromTop(): void {
    const centerOffset = this.el.nativeElement.clientHeight / 2 - this.itemHeight / 2;
    const newIndex = Math.round((centerOffset - this.listTop) / this.itemHeight);
    this.selectedIndex = Math.max(0, Math.min(this.items.length - 1, newIndex));
  }

  private snapTo(index: number): void {
    if (index < 0 || index >= this.items.length) {
      index = 0;
    }
    this.selectedIndex = index;
    const centerOffset = this.el.nativeElement.clientHeight / 2 - this.itemHeight / 2;
    this.listTop = centerOffset - (this.selectedIndex * this.itemHeight);
    this.emitSelection();
  }

  private clampTop(top: number): number {
    const centerOffset = this.el.nativeElement.clientHeight / 2 - this.itemHeight / 2;
    const minTop = centerOffset - (this.items.length - 1) * this.itemHeight;
    const maxTop = centerOffset;
    return Math.max(minTop, Math.min(maxTop, top));
  }

  private emitSelection(): void {
    if (this.items && this.items.length > 0) {
      this.selectedChange.emit(this.items[this.selectedIndex]);
    }
  }
}

declare var Hammer: any; // Add this if you get Hammer-related type errors
