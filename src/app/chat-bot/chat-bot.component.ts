import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { ChatService, ChatMessage } from '../chat.service';

@Component({
  selector: 'app-chat-bot',
  templateUrl: './chat-bot.component.html',
  styleUrls: ['./chat-bot.component.css']
})
export class ChatBotComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = false;
  messages: ChatMessage[] = [
    { text: "Hi! I'm your Bible Guesser assistant. How can I help you?", sender: 'bot', timestamp: new Date() }
  ];
  userInput = '';
  isLoading = false;

  constructor(private chatService: ChatService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  async sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const text = this.userInput;
    this.userInput = '';
    this.messages.push({ text, sender: 'user', timestamp: new Date() });
    this.isLoading = true;

    try {
      const response = await this.chatService.sendMessage(text);
      this.messages.push({ text: response, sender: 'bot', timestamp: new Date() });
    } catch (err) {
      this.messages.push({ text: "Sorry, I couldn't reach the server.", sender: 'bot', timestamp: new Date() });
    } finally {
      this.isLoading = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}
