import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-test-preview',
    standalone: true,
    imports: [CommonModule],
    template: `<div class="container"><h2>Test Preview - Coming Soon</h2></div>`,
    styles: []
})
export class TestPreviewComponent {
}
