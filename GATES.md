# Gates: Dynamic QR Analytics and Customizer Subsystem

OWNS: qr/** app/r/** components/qr/** app/qr/** supabase/migrations/0002_qr_tracking.sql scripts/verify-qr-subsystem.mjs .env.example

Scope: Production-quality dynamic QR redirect route, privacy-preserving scan tracking, analytics aggregation engine, qr-code-styling customizer UI, and Supabase migration.

- [x] G1: Database migration creates qr_codes and qr_scans tables with RLS and required indexes
  CHECK: node scripts/verify-qr-subsystem.mjs --gate g1
  EXPECT: G1_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=c0e9f043b56b22ad4e84e4e9c87b3490ae94e366de7b01e6eb907b0bf47d17ae; exit=0; EXPECT=matched; output-sha256=52abbfb883efc54dc35c04559e947cc3e035bec1c333a470d39a8e7055613b5a; output-bytes=10; shell=/bin/sh; cwd=/home/stealthtensor/EX/pro/aura_club_web; path=1997758aa877/20 entries

- [x] G2: Core TypeScript interfaces cover QR codes, scans, analytics DTOs, and styling configs
  CHECK: node scripts/verify-qr-subsystem.mjs --gate g2
  EXPECT: G2_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=8917bf74907ade3c9ca2b838e45fbe4ec76531abfafe03c561c3c1939ead8e7c; exit=0; EXPECT=matched; output-sha256=ece52ae9b9ce971931f413bddaa51132c4500ed6e63ad02840e8f47b14048498; output-bytes=10; shell=/bin/sh; cwd=/home/stealthtensor/EX/pro/aura_club_web; path=1997758aa877/20 entries

- [x] G3: Metadata extraction captures Geo, UA (device/OS/browser), bot detection, and deterministic salted hash without raw IP
  CHECK: node scripts/verify-qr-subsystem.mjs --gate g3
  EXPECT: G3_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=b06c138382635ad6b0b2efbc7d5c05fcf24c3a6f2d8770dd904355393aedddbd; exit=0; EXPECT=matched; output-sha256=a280f9ff3225816d164bee166f9ccfc992c97b6dd4340cb0b740de48da051d96; output-bytes=10; shell=/bin/sh; cwd=/home/stealthtensor/EX/pro/aura_club_web; path=1997758aa877/20 entries

- [x] G4: Destination URL security validator permits https? and strictly rejects malicious schemes
  CHECK: node scripts/verify-qr-subsystem.mjs --gate g4
  EXPECT: G4_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=5b4473347f34402cef49add7b25376e4814cee6e7296c8bc3a973db332a6c0a8; exit=0; EXPECT=matched; output-sha256=b1c4a4cd73ece178a65b5a83696451c036754f32d5b43ee263e2791db09da17e; output-bytes=10; shell=/bin/sh; cwd=/home/stealthtensor/EX/pro/aura_club_web; path=1997758aa877/20 entries

- [x] G5: Analytics aggregation functions correctly compute totals, unique visitors, time-slices, and breakdowns
  CHECK: node scripts/verify-qr-subsystem.mjs --gate g5
  EXPECT: G5_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=4fe10540c438641e539880023916e3f2b22ee22719597c0192cbd30a43ba28c1; exit=0; EXPECT=matched; output-sha256=86308de17acbf9a6b548b1da9761a635aa3d3eae4efef390ae421c34c44d7e68; output-bytes=10; shell=/bin/sh; cwd=/home/stealthtensor/EX/pro/aura_club_web; path=1997758aa877/20 entries

- [x] G6: QR styling generator wraps qr-code-styling with shapes, corners, colors, gradients, frames, logos, and contrast warning
  CHECK: node scripts/verify-qr-subsystem.mjs --gate g6
  EXPECT: G6_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=73ff26ba5d10d61df3427840a50bf28389ee4cb557d89bf3b7c7776cf1c2f892; exit=0; EXPECT=matched; output-sha256=8071e35d8276c3f5f7e5c8f4c195b0e1b083231778b903c29d571a73f0343e25; output-bytes=10; shell=/bin/sh; cwd=/home/stealthtensor/EX/pro/aura_club_web; path=1997758aa877/20 entries

- [x] G7: Dynamic redirect route /r/[code] validates code, handles rate limiting, logs scan, and issues 302 redirect
  CHECK: node scripts/verify-qr-subsystem.mjs --gate g7
  EXPECT: G7_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=343cc965b8d2c9a9ec1e0a34f7bf4ada2e7f45e98d2cd33c454b6b1274078fda; exit=0; EXPECT=matched; output-sha256=ef01c913215a90a04a6f8238240d1fed5d4f32103dfecc3ff888344131f7d54f; output-bytes=10; shell=/bin/sh; cwd=/home/stealthtensor/EX/pro/aura_club_web; path=1997758aa877/20 entries

- [x] G8: QR Customizer UI component and page render preview, frames, shapes, corners, colors, CTA text, export buttons
  CHECK: node scripts/verify-qr-subsystem.mjs --gate g8
  EXPECT: G8_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=4070ad49ac51213d57becb5df531bfb2b1c075323ffa8423be6803b8c8fe4ffe; exit=0; EXPECT=matched; output-sha256=2d35e3e4364c68947bfc90b199e90603bc23df777172dff1981195112fa47730; output-bytes=10; shell=/bin/sh; cwd=/home/stealthtensor/EX/pro/aura_club_web; path=1997758aa877/20 entries

- [x] G9: Subsystem documentation and privacy architecture documented in qr/README.md
  CHECK: node scripts/verify-qr-subsystem.mjs --gate g9
  EXPECT: G9_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=3bcc2cc6d6d11e98c0f6339af6cb281b89fedf7726d8b63241c2d98f56e07433; exit=0; EXPECT=matched; output-sha256=71de53eefefcbd7ccaa81cdd5ae4f323218a601bee1b4c92f33cba12d150083d; output-bytes=10; shell=/bin/sh; cwd=/home/stealthtensor/EX/pro/aura_club_web; path=1997758aa877/20 entries

- [x] G10: Full E2E suite passes all 15 verification criteria
  CHECK: node scripts/verify-qr-subsystem.mjs --gate all
  EXPECT: ALL_GATES_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=8e897280fcf8ecb1a72d982ed6666faea4086c6d4ed085c174b22881a52d92e8; exit=0; EXPECT=matched; output-sha256=4bf2b57aa9ad8fea06772685d13e0fb46b648f933cb806f271b71cbe77d52bad; output-bytes=107; shell=/bin/sh; cwd=/home/stealthtensor/EX/pro/aura_club_web; path=1997758aa877/20 entries

- [x] G11: TypeScript type checking passes without errors
  CHECK: npm run lint && echo "LINT_PASSED"
  EXPECT: LINT_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=798cfe5c20ada594546d38d1bd9cc20a9ecb2322727af87a5ac332e55e9b6a2c; exit=0; EXPECT=matched; output-sha256=afb6e8295512379d7b88dc59141eb246e30a495227177075f61302a4e57e30aa; output-bytes=56; shell=/bin/sh; cwd=/home/stealthtensor/EX/pro/aura_club_web; path=1997758aa877/20 entries

- [x] G12: Next.js production build completes without errors
  CHECK: npm run build
  EXPECT: Compiled successfully
  EVIDENCE: automatic-evidence=v1; definition-sha256=b0ed4472d4febe1265e2de61a7bd564980644551de79216818644e72867050d0; exit=0; EXPECT=matched; output-sha256=a7838b055be878bfb9797e7f2774c6f397a8c03c2871f433050d735882c9f30a; output-bytes=902; shell=/bin/sh; cwd=/home/stealthtensor/EX/pro/aura_club_web; path=1997758aa877/20 entries
