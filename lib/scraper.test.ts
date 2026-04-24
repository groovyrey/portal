import { describe, it, expect, vi } from 'vitest';
import { ScraperService } from './scraper-service';
import { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';

describe('ScraperService', () => {
  const mockAxios = {
    get: vi.fn(),
    post: vi.fn(),
  } as unknown as AxiosInstance;

  const scraper = new ScraperService(mockAxios, 'test-user-id');

  it('should detect logged out state correctly', async () => {
    const loggedOutHtml = '<html><body><input id="otbUserID" /></body></html>';
    vi.mocked(mockAxios.get).mockResolvedValue({ data: loggedOutHtml, request: { res: { responseUrl: '' } } });

    const result = await scraper.fetchDashboard();
    expect(result.isLoggedOut).toBe(true);
  });

  it('should parse student info correctly from EAF', async () => {
    const mockEafHtml = `
      <html>
        <body>
          <span id="fldName">DOE, JOHN SMITH</span>
          <span id="fldCourseDesc">BS IN COMPUTER SCIENCE</span>
          <span id="fldStuID">2023-0001</span>
          <span id="fldLevelDesc">1ST YEAR</span>
        </body>
      </html>
    `;
    const $eaf = cheerio.load(mockEafHtml);
    const $dashboard = cheerio.load('<html></html>');

    const info = await scraper.parseStudentInfo($dashboard, $eaf);
    expect(info.name).toBe('DOE, JOHN SMITH');
    expect(info.course).toBe('BS IN COMPUTER SCIENCE');
    expect(info.studentId).toBe('2023-0001');
  });

  it('should handle missing schedule gracefully', async () => {
    const emptyEafHtml = '<html><body><table id="otbEnrollmentTable"><tr><td>Header</td></tr></table></body></html>';
    const $eaf = cheerio.load(emptyEafHtml);

    const schedule = await scraper.parseSchedule($eaf);
    expect(schedule).toEqual([]);
  });
});
