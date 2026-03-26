import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private meta = inject(Meta);
  private scroller = inject(ViewportScroller);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Push anchored content below the sticky header when using fragment links.
      // Reads the actual header height at runtime so it stays correct on resize.
      const updateOffset = () => {
        const h = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 80;
        this.scroller.setOffset([0, Math.ceil(h) + 16]);
      };
      updateOffset();
      window.addEventListener('resize', updateOffset, { passive: true });

      // Scroll to top on every page navigation that has no fragment.
      // withInMemoryScrolling handles back-button position restore, but it fires
      // before the lazy-loaded component is in the DOM — so we add this explicit
      // call which runs after the current microtask queue flushes (setTimeout 0),
      // ensuring the new page is rendered before we scroll.
      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd),
      ).subscribe((e: NavigationEnd) => {
        if (!e.urlAfterRedirects.includes('#')) {
          setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }), 0);
        }
      });
    }

    // Update meta description on every navigation.
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) route = route.firstChild;
        return route.snapshot.data['description'] as string | undefined;
      }),
    ).subscribe(description => {
      if (description) {
        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ property: 'og:description', content: description });
      }
    });
  }
}
