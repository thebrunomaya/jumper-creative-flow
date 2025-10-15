/**
 * Jumper Hub Version
 *
 * Following semantic versioning: MAJOR.MINOR.PATCH
 *
 * PATCH (x.x.N): Auto-incremented by Claude on each commit
 * MINOR (x.N.0): User-signaled feature releases
 * MAJOR (N.0.0): User-signaled breaking changes
 */
export const APP_VERSION = 'v2.0.3';

/**
 * Version history:
 * - v2.0.3 (2024-10-14):
 *   - Fixed production login issues (email + Notion OAuth)
 *   - Improved userExists() with RLS-safe fallback strategy
 *   - Added OAuth hash cleanup to prevent redirect loops
 *   - Enhanced error handling in ensureUserRole()
 *   - Added detailed production logging
 *
 * - v2.0.2 (2024-10-14):
 *   - Fixed CLAUDE.md deployment documentation (clarified Vercel auto-deploy vs Supabase manual)
 *
 * - v2.0.1 (2024-10-14):
 *   - Centralized version management
 *
 * - v2.0.0 (2024-10-14):
 *   - Composite authorization system
 *   - Role auto-detection (@jumper.studio)
 *   - Local dev environment safety
 *   - Environment variable precedence fix
 *
 * - v1.0.0 (2024-09-XX): Initial release
 *   - Creative submission system
 *   - 9 specialized dashboards
 *   - Notion integration
 *   - Resilient architecture
 */
