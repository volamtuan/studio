# **App Name**: Notepad Scraper

## Core Features:

- Content Fetching: Continuously fetch content from notepad.vn using random IDs.
- Content Validation: Check length is greater than 5 and filter duplicate contents based on MD5 hash.
- Data Storage: Save the validated contents into daily directories using the MD5 hash as the filename.
- Proxy Management: Allow users to input proxies; rotate through proxies when fetching content.
- UI Interface: Display status logs, data directories, and provide control to start/stop the crawler.
- Authentication: Secure the crawler functions with login authentication.

## Style Guidelines:

- Primary color: Deep Indigo (#4B0082) to give the app a serious and professional feel, reminiscent of system administration tools.
- Background color: Dark Gray (#282828), which is easy on the eyes and suitable for prolonged use.
- Accent color: Electric Purple (#BF00FF) to highlight important elements and interactive components.
- Body and headline font: 'Inter', a sans-serif font that ensures the UI remains clean and scannable, since the app will likely display fairly long strings of machine-generated information.
- Code font: 'Source Code Pro' for code blocks and file names
- Simple, clear icons for status and actions, in white or light gray for maximum visibility on the dark background.
- A functional layout for managing and viewing the crawler's output, using clear dividers, and adequate spacing.
- Subtle animations or transitions during state changes.