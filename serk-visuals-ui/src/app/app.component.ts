import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT, ViewportScroller, isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';

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
  private titleService = inject(Title);
  private doc = inject(DOCUMENT);
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

    // Update meta tags and canonical on every navigation.
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
    ).subscribe((e: NavigationEnd) => {
      let route = this.activatedRoute;
      while (route.firstChild) route = route.firstChild;
      const data = route.snapshot.data;
      const description = data['description'] as string | undefined;

      if (description) {
        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ name: 'twitter:description', content: description });
      }

      // Sync og:title and twitter:title with the page <title>
      const pageTitle = this.titleService.getTitle();
      this.meta.updateTag({ property: 'og:title', content: pageTitle });
      this.meta.updateTag({ name: 'twitter:title', content: pageTitle });

      // noindex for admin pages
      const path = e.urlAfterRedirects.split('?')[0].split('#')[0];
      if (path.startsWith('/admin')) {
        this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
      } else {
        this.meta.updateTag({ name: 'robots', content: 'index, follow' });
      }

      // Canonical URL and og:url
      const canonical = 'https://serkvisuals.com' + (path === '/' ? '' : path);
      this.meta.updateTag({ property: 'og:url', content: canonical });

      let canonicalEl = this.doc.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
      if (!canonicalEl) {
        canonicalEl = this.doc.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        this.doc.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute('href', canonical);
    });
  }
}
