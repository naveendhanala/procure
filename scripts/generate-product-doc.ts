import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  TableOfContents,
  StyleLevel,
  PageBreak,
  ShadingType,
} from "docx";
import * as fs from "fs";

const BLUE = "2563EB";
const DARK = "1E293B";
const GRAY = "64748B";
const LIGHT_BG = "F1F5F9";

function heading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: DARK, font: "Calibri" })],
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 26, color: BLUE, font: "Calibri" })],
  });
}

function heading3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, color: DARK, font: "Calibri" })],
  });
}

function para(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 21, color: DARK, font: "Calibri" })],
  });
}

function bullet(text: string, level = 0): Paragraph {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 21, color: DARK, font: "Calibri" })],
  });
}

function boldPara(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: label, bold: true, size: 21, color: DARK, font: "Calibri" }),
      new TextRun({ text: value, size: 21, color: DARK, font: "Calibri" }),
    ],
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({ spacing: { after: 100 }, children: [] });
}

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
};

function headerCell(text: string, width?: number): TableCell {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: { type: ShadingType.SOLID, color: BLUE, fill: BLUE },
    borders: cellBorders,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF", font: "Calibri" })],
      }),
    ],
  });
}

function cell(text: string, width?: number): TableCell {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    borders: cellBorders,
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20, color: DARK, font: "Calibri" })],
      }),
    ],
  });
}

function makeTable(headers: string[], rows: string[][], colWidths?: number[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((h, i) => headerCell(h, colWidths?.[i])),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map((c, i) => cell(c, colWidths?.[i])),
          })
      ),
    ],
  });
}

async function main() {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 21 } },
      },
    },
    features: { updateFields: true },
    sections: [
      // ── COVER PAGE ──
      {
        children: [
          emptyLine(),
          emptyLine(),
          emptyLine(),
          emptyLine(),
          emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: "ProCure", bold: true, size: 72, color: BLUE, font: "Calibri" })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: "Procurement Management System", size: 36, color: DARK, font: "Calibri" })],
          }),
          emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: "Product Documentation", size: 28, color: GRAY, font: "Calibri" })],
          }),
          emptyLine(),
          emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Version 1.0  |  ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, size: 22, color: GRAY, font: "Calibri" })],
          }),
          emptyLine(),
          emptyLine(),
          emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Confidential", italics: true, size: 20, color: GRAY, font: "Calibri" })],
          }),
        ],
      },

      // ── TABLE OF CONTENTS ──
      {
        children: [
          heading1("Table of Contents"),
          new TableOfContents("Table of Contents", {
            hyperlink: true,
            headingStyleRange: "1-3",
            stylesWithLevels: [
              new StyleLevel("Heading1", 1),
              new StyleLevel("Heading2", 2),
              new StyleLevel("Heading3", 3),
            ],
          }),
        ],
      },

      // ── MAIN CONTENT ──
      {
        children: [
          // ────────────────────────────────────────
          // 1. EXECUTIVE SUMMARY
          // ────────────────────────────────────────
          heading1("1. Executive Summary"),
          para(
            "ProCure is a web-based Procurement Management System designed to digitize and streamline the end-to-end procurement lifecycle for organizations operating across multiple site locations. The system covers the complete workflow from material indent creation by site project managers, through a configurable multi-level approval process, procurement execution (RFQ, vendor quote comparison, purchase order generation), goods receipt at site, and automatic inventory updates."
          ),
          para(
            "The system enforces strict role-based access control to ensure that site personnel can track indent progress without visibility into commercial details such as purchase order values and vendor rates, maintaining procurement confidentiality."
          ),
          emptyLine(),
          heading2("1.1 Key Business Objectives"),
          bullet("Digitize the material indent-to-delivery lifecycle, eliminating manual tracking and paper-based processes"),
          bullet("Provide configurable approval workflows per site to accommodate varying organizational hierarchies"),
          bullet("Enable real-time inventory visibility during indent creation and approval to reduce unnecessary procurement"),
          bullet("Streamline vendor management, RFQ distribution, and quote comparison to drive competitive procurement"),
          bullet("Enforce information segregation between site operations and procurement commercial activities"),
          bullet("Maintain a complete audit trail of all approvals, procurement decisions, and material receipts"),

          // ────────────────────────────────────────
          // 2. SYSTEM OVERVIEW
          // ────────────────────────────────────────
          // ────────────────────────────────────────
          // QUICK START - LOGIN CREDENTIALS
          // ────────────────────────────────────────
          heading1("2. Quick Start - Login Credentials"),
          para("The following test accounts are pre-seeded in the system for evaluation and testing. All accounts use the same password."),
          emptyLine(),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "Password for all accounts: ", bold: true, size: 24, color: DARK, font: "Calibri" }),
              new TextRun({ text: "password123", bold: true, size: 28, color: BLUE, font: "Calibri" }),
            ],
          }),
          emptyLine(),
          makeTable(
            ["Email", "Name", "Role", "Assigned Sites"],
            [
              ["admin@procure.com", "System Admin", "Super Admin", "MUM-01, DEL-01, BLR-01"],
              ["pm.mumbai@procure.com", "Rajesh Kumar", "Project Manager", "MUM-01"],
              ["pm.delhi@procure.com", "Suresh Sharma", "Project Manager", "DEL-01"],
              ["ch.mumbai@procure.com", "Priya Patel", "Cluster Head", "MUM-01, BLR-01"],
              ["vp@procure.com", "Anil Mehta", "Vice President", "MUM-01, DEL-01, BLR-01"],
              ["hop@procure.com", "Meera Singh", "Head of Procurement", "MUM-01, DEL-01, BLR-01"],
              ["buyer1@procure.com", "Amit Desai", "Procurement Team Member", "MUM-01, DEL-01"],
              ["buyer2@procure.com", "Sneha Reddy", "Procurement Team Member", "MUM-01, BLR-01"],
              ["store.mumbai@procure.com", "Ramesh Iyer", "Store Manager", "MUM-01"],
              ["store.delhi@procure.com", "Vikram Tiwari", "Store Manager", "DEL-01"],
            ],
            [25, 16, 22, 37]
          ),
          emptyLine(),
          para("Recommended testing sequence: Login as PM (pm.mumbai@procure.com) to create an indent, then as CH (ch.mumbai@procure.com) to approve, then VP (vp@procure.com) for final approval, then HoP (hop@procure.com) to assign, then Buyer (buyer1@procure.com) for RFQ/PO, and finally Store Manager (store.mumbai@procure.com) to record delivery."),

          // ────────────────────────────────────────
          // 3. SYSTEM OVERVIEW
          // ────────────────────────────────────────
          heading1("3. System Overview"),

          heading2("3.1 Technology Stack"),
          makeTable(
            ["Component", "Technology", "Purpose"],
            [
              ["Frontend Framework", "Next.js 14 (App Router)", "Server-side rendering, React-based UI, API routes"],
              ["UI Library", "React 18", "Component-based user interface"],
              ["Styling", "Tailwind CSS + shadcn/ui", "Utility-first CSS with pre-built accessible components"],
              ["Backend Runtime", "Node.js (Serverless)", "API route handlers via Next.js serverless functions"],
              ["ORM", "Prisma 5", "Type-safe database access and migrations"],
              ["Database", "PostgreSQL (Neon)", "Serverless-compatible relational database"],
              ["Authentication", "NextAuth.js 4", "JWT-based session management with credentials provider"],
              ["Validation", "Zod", "Schema-based input validation (client and server)"],
              ["Deployment", "Vercel", "Serverless deployment with global CDN"],
            ]
          ),
          emptyLine(),

          heading2("3.2 Scale & Performance"),
          bullet("Designed for approximately 200-300 concurrent users"),
          bullet("Supports several thousand material indents per month"),
          bullet("20 site locations with independent inventory tracking"),
          bullet("Serverless architecture auto-scales with demand on Vercel"),
          bullet("Connection pooling via Neon PostgreSQL for efficient database usage"),

          heading2("3.3 Deployment Architecture"),
          para(
            "The application is deployed as a single Next.js application on Vercel. Static pages are served from Vercel's global CDN, while API routes execute as serverless functions. The PostgreSQL database is hosted on Neon, providing serverless-compatible connection pooling. Authentication uses JWT tokens stored client-side, eliminating the need for sticky sessions."
          ),

          // ────────────────────────────────────────
          // 3. USER ROLES & ACCESS CONTROL
          // ────────────────────────────────────────
          heading1("4. User Roles & Access Control"),
          para(
            "The system implements Role-Based Access Control (RBAC) with seven distinct roles. Each user is assigned one or more roles, scoped to specific sites. A single user may hold different roles at different sites."
          ),
          emptyLine(),
          makeTable(
            ["Role", "Abbreviation", "Description", "Key Permissions"],
            [
              ["Super Admin", "SA", "System administrator responsible for master data and configuration", "Full access to sites, users, materials, vendors, and workflow configuration"],
              ["Project Manager", "PM", "Site-level manager who initiates material requirements", "Create, edit, and submit material indents; view inventory; track indent status"],
              ["Cluster Head", "CH", "Mid-level approver managing a cluster of sites (optional per site)", "Review and approve/reject material indents; view inventory at assigned sites"],
              ["Vice President", "VP", "Senior approver and final approval authority for indents", "Review and approve/reject material indents; view inventory at all assigned sites"],
              ["Head of Procurement", "HoP", "Procurement department head who oversees all procurement activities", "View all approved indents; assign indents to team members; manage vendors; full access to RFQ, quotes, and POs"],
              ["Procurement Team Member", "PTM", "Buyer who executes procurement for assigned indents", "Work on assigned indents; create RFQs, enter vendor quotes, create purchase orders"],
              ["Store Manager", "SM", "Site-level personnel responsible for receiving materials", "Record goods receipts (GRN); confirm material delivery; view inventory"],
            ],
            [15, 8, 30, 47]
          ),
          emptyLine(),

          heading2("4.1 Information Segregation"),
          para(
            "A critical business requirement is that site personnel (Project Manager, Cluster Head, Vice President) must NOT have visibility into procurement commercial details. The system enforces this at multiple levels:"
          ),
          emptyLine(),
          heading3("4.1.1 API-Level Enforcement"),
          bullet("The indent detail API strips RFQ, quote, and purchase order data from responses when the requesting user holds only site roles"),
          bullet("Purchase Order and Quote API endpoints return HTTP 403 (Forbidden) for users without procurement roles"),
          bullet("Indent status is mapped to simplified labels for site users (e.g., 'In Procurement' instead of 'RFQ_SENT' or 'QUOTES_RECEIVED')"),
          emptyLine(),
          heading3("4.1.2 UI-Level Enforcement"),
          bullet("Navigation sidebar only shows menu items relevant to the user's roles"),
          bullet("Procurement-related pages (RFQ, Quotes, Purchase Orders) are not accessible to site roles"),
          bullet("Server-side session checks redirect unauthorized users away from restricted pages"),
          emptyLine(),
          heading3("4.1.3 Status Display Mapping"),
          makeTable(
            ["Internal Status", "Site Team Sees", "Procurement Team Sees"],
            [
              ["DRAFT", "Draft", "Draft"],
              ["PENDING_APPROVAL", "Pending Approval", "Pending Approval"],
              ["PARTIALLY_APPROVED", "Pending Approval", "Partially Approved"],
              ["APPROVED", "Approved - In Procurement", "Approved"],
              ["REJECTED", "Rejected", "Rejected"],
              ["ASSIGNED", "In Procurement", "Assigned"],
              ["RFQ_SENT", "In Procurement", "RFQ Sent"],
              ["QUOTES_RECEIVED", "In Procurement", "Quotes Received"],
              ["PO_CREATED", "Ordered", "PO Created"],
              ["PARTIALLY_RECEIVED", "Partially Delivered", "Partially Received"],
              ["FULLY_RECEIVED", "Delivered", "Fully Received"],
              ["CANCELLED", "Cancelled", "Cancelled"],
            ],
            [30, 35, 35]
          ),

          // ────────────────────────────────────────
          // 4. FUNCTIONAL MODULES
          // ────────────────────────────────────────
          heading1("5. Functional Modules"),

          // 4.1 Site Management
          heading2("5.1 Site Management"),
          para(
            "The system supports 20 site locations, each with independent configuration for approval workflows, user assignments, and inventory tracking."
          ),
          heading3("5.1.1 Site Configuration"),
          bullet("Each site has a unique code (e.g., MUM-01, DEL-01, BLR-01) and descriptive name"),
          bullet("Address, city, and state fields for physical location tracking"),
          bullet("Active/inactive status to enable or disable sites"),
          bullet("Configurable approval workflow (see Section 4.3)"),
          heading3("5.1.2 Site Features"),
          bullet("View all users assigned to a site and their roles"),
          bullet("View count of indents and user assignments per site"),
          bullet("Manage approval workflow steps directly from the site detail page"),

          // 4.2 User Management
          heading2("5.2 User Management"),
          para("Comprehensive user administration with flexible multi-site, multi-role assignments."),
          heading3("5.2.1 User Profile"),
          bullet("Full name, email (used for login), phone number"),
          bullet("Password authentication with bcrypt hashing (10 rounds)"),
          bullet("Active/inactive status to enable or disable user access"),
          heading3("5.2.2 Site-Role Assignments"),
          bullet("Each user can be assigned to multiple sites with different roles"),
          bullet("A user may hold different roles at different sites (e.g., Cluster Head at Mumbai, Vice President at Delhi)"),
          bullet("Assignments are managed through the user detail page with add/remove capability"),
          bullet("The unique constraint (userId, siteId, role) prevents duplicate assignments"),
          heading3("5.2.3 Authentication"),
          bullet("Email and password-based login via NextAuth.js Credentials provider"),
          bullet("JWT session strategy (no server-side session storage) for Vercel compatibility"),
          bullet("Session token includes user ID and all site-role assignments for efficient authorization"),
          bullet("24-hour session expiry with automatic redirect to login"),

          // 4.3 Approval Workflow
          heading2("5.3 Configurable Approval Workflow"),
          para(
            "Each site has its own approval workflow defined as an ordered sequence of approval steps. This allows the system to accommodate different organizational structures across sites."
          ),
          heading3("5.3.1 Workflow Configuration"),
          bullet("Approval steps are defined per site by the Super Admin"),
          bullet("Each step specifies a role (Cluster Head or Vice President) and a sequence order"),
          bullet("Sites can have 1 to N approval steps"),
          bullet("A site without a Cluster Head simply omits that step (e.g., Delhi site: Step 1 = Vice President only)"),
          bullet("A site with full hierarchy includes both (e.g., Mumbai site: Step 1 = Cluster Head, Step 2 = Vice President)"),
          heading3("5.3.2 Workflow Execution"),
          bullet("When a Project Manager submits an indent, the system sets currentApprovalStep to 1"),
          bullet("The system identifies the role required for the current step from the site's workflow configuration"),
          bullet("Any user assigned to that site with the matching role can approve or reject"),
          bullet("On approval: if more steps remain, the step counter advances; if it was the last step, the indent becomes APPROVED"),
          bullet("On rejection: the indent is immediately marked REJECTED regardless of which step rejected it"),
          bullet("Optimistic concurrency control prevents race conditions when multiple users hold the same role"),
          heading3("5.3.3 Workflow Examples"),
          para("Example 1 - Mumbai Site (2-step approval):"),
          bullet("PM creates and submits indent", 0),
          bullet("Cluster Head at Mumbai reviews and approves (Step 1)", 0),
          bullet("Vice President reviews and approves (Step 2)", 0),
          bullet("Indent status becomes APPROVED", 0),
          emptyLine(),
          para("Example 2 - Delhi Site (1-step approval, no Cluster Head):"),
          bullet("PM creates and submits indent", 0),
          bullet("Vice President reviews and approves (Step 1)", 0),
          bullet("Indent status becomes APPROVED", 0),

          // 4.4 Material Master
          heading2("5.4 Material Master"),
          para("Centralized catalog of all materials that can be requisitioned across sites."),
          heading3("5.4.1 Material Attributes"),
          bullet("Unique material code (e.g., MAT-CEM-001) and descriptive name"),
          bullet("Category classification (Cement, Steel, Sand & Aggregate, Bricks & Blocks, Plywood, Electrical, Plumbing, Finishing, Tiles, Hardware, Paint, Other)"),
          bullet("Unit of Measure: NOS, KG, TONNES, METERS, SQ_METERS, CU_METERS, LITERS, BAGS, BUNDLES, ROLLS, SHEETS, SETS, BOXES"),
          bullet("Optional HSN/SAC code for GST compliance"),
          bullet("Optional description field"),
          bullet("Active/inactive status"),
          heading3("5.4.2 Material Features"),
          bullet("Search functionality by name or code"),
          bullet("Category-based filtering"),
          bullet("Material catalog is shared across all sites"),

          // 4.5 Inventory
          heading2("5.5 Inventory Management"),
          para("Per-site inventory tracking with automatic updates on material receipt."),
          heading3("5.5.1 Inventory Model"),
          bullet("Inventory is tracked per site per material (unique combination of siteId and materialId)"),
          bullet("Quantity is stored as Decimal(12,3) supporting fractional quantities"),
          bullet("Inventory records are automatically created when materials are first received at a site"),
          heading3("5.5.2 Inventory Integration Points"),
          bullet("During Indent Creation: When a PM adds a material, the system fetches and displays the current stock at the selected site in real-time. The stock at creation time is saved as a snapshot (stockAtCreation) on each indent item."),
          bullet("During Indent Approval: Each approver sees both the stock at creation time and the current live stock, enabling informed decisions about whether additional procurement is needed."),
          bullet("On GRN Confirmation: When a Store Manager confirms a Goods Receipt Note, the accepted quantity for each material is atomically added to the site's inventory using a database transaction with upsert operations."),
          heading3("5.5.3 Inventory View"),
          bullet("Site-selectable inventory dashboard showing all materials and current stock"),
          bullet("Search and filter by material name or code"),
          bullet("Color-coded stock levels (green for positive stock, orange for zero stock)"),

          // 4.6 Material Indent
          heading2("5.6 Material Indent"),
          para(
            "The material indent is the core document in the system. It represents a request from a site for materials, flowing through approval, procurement, and delivery."
          ),
          heading3("5.6.1 Indent Creation"),
          bullet("Only Project Managers can create indents"),
          bullet("PM selects the site (auto-selected if assigned to only one site)"),
          bullet("PM adds materials from the master catalog, specifying quantity for each"),
          bullet("For each material added, the system displays current inventory stock at the site"),
          bullet("PM sets priority (Normal, Urgent, Critical) and optional required-by date"),
          bullet("PM can add remarks and per-item remarks"),
          bullet("Indent is saved as DRAFT status initially"),
          heading3("5.6.2 Auto-Generated Indent Number"),
          para("Format: IND-{SITE_CODE}-{YEAR}-{SEQUENCE}"),
          para("Example: IND-MUM01-2026-0042"),
          bullet("Sequence is auto-incremented per site per year within a database transaction to prevent duplicates"),
          heading3("5.6.3 Indent Lifecycle"),
          makeTable(
            ["Status", "Description", "Allowed Actions"],
            [
              ["DRAFT", "Indent created but not yet submitted", "Edit, Delete, Submit for Approval"],
              ["PENDING_APPROVAL", "Awaiting first approver's action", "Approve, Reject (by designated approver)"],
              ["PARTIALLY_APPROVED", "At least one approval received, more pending", "Approve, Reject (by next approver)"],
              ["APPROVED", "All approval steps completed", "Assign to PTM (by HoP)"],
              ["REJECTED", "Rejected at any approval step", "No further actions"],
              ["ASSIGNED", "HoP has assigned to a Procurement Team Member", "Create RFQ (by assigned PTM)"],
              ["RFQ_SENT", "RFQ created and sent to vendors", "Enter vendor quotes"],
              ["QUOTES_RECEIVED", "At least one vendor quote received", "Compare quotes, Create PO"],
              ["PO_CREATED", "Purchase order issued to vendor", "Await delivery"],
              ["PARTIALLY_RECEIVED", "Some materials received via GRN", "Record additional GRNs"],
              ["FULLY_RECEIVED", "All materials received and confirmed", "Complete"],
              ["CANCELLED", "Indent cancelled", "No further actions"],
            ],
            [20, 40, 40]
          ),
          emptyLine(),
          heading3("5.6.4 Indent Detail View"),
          bullet("Full indent information: site, creator, date, priority, required date, remarks"),
          bullet("Material items table with quantity, unit, stock at creation, and current live stock"),
          bullet("Approval history timeline showing each approver's action, role, remarks, and timestamp"),
          bullet("For procurement users: linked RFQs, quotes, and purchase orders are also displayed"),
          bullet("Action buttons contextually shown based on user role and indent status"),

          // 4.7 Vendor Management
          heading2("5.7 Vendor Management"),
          para("Vendor directory for managing suppliers who are already onboarded in the system."),
          heading3("5.7.1 Vendor Profile"),
          bullet("Unique vendor code and name"),
          bullet("Contact person, email, phone number"),
          bullet("Address, city, state"),
          bullet("Tax details: GST Number, PAN Number"),
          bullet("Bank details: Bank Name, Account Number, IFSC Code"),
          bullet("Active/inactive status"),
          heading3("5.7.2 Vendor Categories"),
          bullet("Each vendor is tagged with material categories they supply (e.g., Cement, Steel, Electrical)"),
          bullet("Categories must match the material catalog categories"),
          bullet("During RFQ creation, the system suggests vendors whose categories match the indent's materials"),
          heading3("5.7.3 Vendor Management Access"),
          bullet("Super Admin and Head of Procurement can create and edit vendors"),
          bullet("Procurement Team Members have read-only access to vendor directory"),
          bullet("Site roles have no access to vendor information"),

          // 4.8 RFQ
          heading2("5.8 Request for Quotation (RFQ)"),
          para("The RFQ module enables procurement team members to solicit quotes from multiple vendors for material requirements."),
          heading3("5.8.1 RFQ Creation"),
          bullet("Created from an assigned indent by the Procurement Team Member"),
          bullet("System automatically populates RFQ line items from indent items (material, quantity, unit)"),
          bullet("PTM selects vendors to send the RFQ to; system suggests vendors matching material categories"),
          bullet("Optional due date for vendor response and remarks field for special instructions"),
          bullet("Auto-generated RFQ number: RFQ-{YEAR}-{SEQUENCE} (e.g., RFQ-2026-0015)"),
          heading3("5.8.2 RFQ Tracking"),
          bullet("RFQ status progression: DRAFT -> SENT -> QUOTES_RECEIVED -> CLOSED"),
          bullet("View all vendors associated with the RFQ and their quote submission status"),
          bullet("Track which vendors have submitted quotes and which are pending"),

          // 4.9 Quote
          heading2("5.9 Vendor Quote Management"),
          para("PTMs enter vendor quotes received against RFQs, enabling side-by-side comparison."),
          heading3("5.9.1 Quote Entry"),
          bullet("PTM enters quote details per vendor from the RFQ detail page"),
          bullet("For each material: unit price, GST percentage, and total price (auto-calculated)"),
          bullet("Quote number (vendor's reference), validity date, and remarks"),
          bullet("System auto-calculates total quote amount"),
          heading3("5.9.2 Quote Comparison"),
          bullet("Side-by-side comparison table on the RFQ detail page"),
          bullet("Rows represent materials, columns represent vendors"),
          bullet("Each cell shows unit price; lowest price per material is highlighted in green"),
          bullet("Total quote amounts displayed in the summary row"),
          bullet("Enables data-driven vendor selection for purchase order creation"),

          // 4.10 Purchase Order
          heading2("5.10 Purchase Order"),
          para("Purchase orders are generated after vendor selection from the quote comparison."),
          heading3("5.10.1 PO Creation"),
          bullet("Created from an indent after quote comparison"),
          bullet("System pre-populates line items from the selected vendor's quote (quantities, rates, GST)"),
          bullet("PTM can edit quantities, unit prices, and GST percentages"),
          bullet("Delivery date, delivery address (defaults to site address), terms & conditions, and remarks"),
          bullet("Auto-calculated subtotal, GST amount, and grand total"),
          bullet("Auto-generated PO number: PO-{YEAR}-{SEQUENCE} (e.g., PO-2026-0008)"),
          heading3("5.10.2 PO Lifecycle"),
          bullet("DRAFT: PO created but not yet issued"),
          bullet("ISSUED: PO issued to vendor (status set on creation)"),
          bullet("PARTIALLY_RECEIVED: Some items received via GRN"),
          bullet("FULLY_RECEIVED: All items received and confirmed"),
          bullet("CANCELLED: PO cancelled"),
          heading3("5.10.3 PO Visibility"),
          bullet("Full PO details (rates, amounts, vendor) visible only to procurement roles"),
          bullet("Store Manager can see PO items and quantities (for receiving) but pricing is hidden"),
          bullet("Site team (PM, CH, VP) has no access to PO details"),

          // 4.11 GRN
          heading2("5.11 Goods Receipt Note (GRN)"),
          para("The GRN module enables Store Managers to record material deliveries at site and update inventory."),
          heading3("5.11.1 GRN Creation"),
          bullet("Only Store Managers can create GRNs"),
          bullet("SM selects their site and a Purchase Order (filtered to ISSUED or PARTIALLY_RECEIVED POs for that site)"),
          bullet("System displays PO line items with ordered quantities"),
          bullet("SM enters for each material: received quantity, accepted quantity, rejected quantity"),
          bullet("Vehicle number, delivery challan number, received date, and remarks"),
          bullet("GRN is saved as DRAFT status initially"),
          bullet("Auto-generated GRN number: GRN-{SITE_CODE}-{YEAR}-{SEQUENCE} (e.g., GRN-MUM01-2026-0023)"),
          heading3("5.11.2 GRN Confirmation"),
          para("When the Store Manager confirms a GRN, the following operations execute atomically within a single database transaction:"),
          bullet("For each material item, the accepted quantity is added to the site's inventory (upsert operation)", 0),
          bullet("The GRN status is set to CONFIRMED", 0),
          bullet("The system checks if all PO items have been fully received across all confirmed GRNs", 0),
          bullet("PO status is updated to PARTIALLY_RECEIVED or FULLY_RECEIVED accordingly", 0),
          bullet("The parent indent status is also updated to reflect the receipt status", 0),
          heading3("5.11.3 GRN Detail View"),
          bullet("Complete GRN information: PO reference, vendor, site, receiver, dates"),
          bullet("Material items table showing ordered vs received vs accepted vs rejected quantities"),
          bullet("Confirmation action button (visible only to Store Manager for DRAFT GRNs)"),
          bullet("Confirmation status indicator for already-confirmed GRNs"),

          // ────────────────────────────────────────
          // 6. INTERACTIVE UI FEATURES
          // ────────────────────────────────────────
          heading1("6. Interactive UI Features"),
          para("The application includes numerous interactive features designed to streamline user workflows and provide real-time feedback."),
          emptyLine(),

          heading2("6.1 Role-Aware Navigation & Layout"),
          bullet("Sidebar navigation dynamically shows/hides menu items based on the logged-in user's roles across all assigned sites"),
          bullet("11 navigation items are filtered: Dashboard, Material Indents, Approvals, Procurement, Goods Receipt, Inventory, Sites, Users, Materials, Vendors, Settings"),
          bullet("Active route is visually highlighted with primary color background"),
          bullet("Header displays welcome message with user name, role badges for all assigned roles, and a user dropdown menu"),
          bullet("User dropdown shows full name, email, all site-role assignments, and sign-out option"),
          emptyLine(),

          heading2("6.2 Role-Specific Dashboard"),
          para("The dashboard renders different quick-action cards based on the user's roles:"),
          bullet("Project Manager: 'My Indents' card with New Indent button + 'Site Inventory' card with direct link"),
          bullet("Cluster Head / Vice President: 'Pending Approvals' card linking to the approval queue"),
          bullet("Head of Procurement: 'Procurement' card for managing the procurement pipeline"),
          bullet("Procurement Team Member: 'My Assignments' card showing assigned indents"),
          bullet("Store Manager: 'Goods Receipt' card for managing material deliveries"),
          bullet("Super Admin: 'Administration' card linking to the admin panel"),
          bullet("Bottom section displays all site-role assignments with site codes and role badges"),
          emptyLine(),

          heading2("6.3 Real-Time Inventory Lookup"),
          bullet("During indent creation: selecting a material triggers an API call to fetch current stock at the selected site"),
          bullet("Stock is displayed inline next to each material row with color coding (green for positive, orange for zero)"),
          bullet("During approval: both stock-at-creation and current-live-stock are shown side-by-side for each material"),
          bullet("Inventory snapshots are captured as JSON at each approval step for audit trail"),
          emptyLine(),

          heading2("6.4 Dynamic Form Interactions"),
          heading3("6.4.1 Indent Creation Form"),
          bullet("Add/remove material items dynamically with '+' and trash icon buttons"),
          bullet("Material selector auto-populates the unit of measure field"),
          bullet("Real-time inventory fetch on material selection"),
          bullet("Per-item remarks field for additional notes"),
          bullet("Auto-selection of site if user is assigned to only one site"),
          emptyLine(),

          heading3("6.4.2 Quote Entry Dialog"),
          bullet("Modal dialog opens from the RFQ detail page for each vendor"),
          bullet("Grid-based form showing all materials with quantity, unit price, GST %, and total columns"),
          bullet("Auto-calculation: total price updates instantly when unit price is changed (quantity x unit price)"),
          bullet("System auto-calculates overall quote total across all line items"),
          emptyLine(),

          heading3("6.4.3 Quote Comparison Table"),
          bullet("Side-by-side matrix: rows = materials, columns = vendors"),
          bullet("Each cell displays unit price per material per vendor"),
          bullet("Lowest price per material is automatically highlighted in green bold text"),
          bullet("Summary row shows total quote amount for each vendor"),
          emptyLine(),

          heading3("6.4.4 GRN Quantity Split"),
          bullet("Three-field entry per material: Received Quantity, Accepted Quantity, Rejected Quantity"),
          bullet("Smart defaults: entering received quantity auto-fills accepted = received, rejected = 0"),
          bullet("User can manually adjust accepted/rejected for partial acceptance scenarios"),
          emptyLine(),

          heading2("6.5 Status Filtering & Search"),
          bullet("Indent list page: dropdown filter with 8 status options (All, Draft, Pending Approval, Approved, Rejected, Assigned, PO Created, Fully Received)"),
          bullet("Material catalog: real-time text search by name or code with 300ms debounce"),
          bullet("Inventory page: site selector dropdown + real-time text search by material name or code"),
          bullet("Vendor directory: category-based filtering through API query parameters"),
          emptyLine(),

          heading2("6.6 Contextual Action Buttons"),
          para("Action buttons appear conditionally based on both user role AND document status:"),
          bullet("Draft indent + creator: Submit for Approval, Edit Indent buttons"),
          bullet("Pending approval + matching approver role: Approve and Reject buttons with remarks textarea"),
          bullet("Approved indent + HoP role: Assign button opens PTM selection dialog"),
          bullet("Assigned indent + PTM role: Create RFQ button"),
          bullet("Quotes received + PTM role: Create PO button"),
          bullet("Draft GRN + Store Manager: Confirm GRN & Update Inventory button"),
          emptyLine(),

          heading2("6.7 Approval History Timeline"),
          bullet("Visual timeline on indent detail page showing all approval/rejection actions"),
          bullet("Each entry shows: approver name, action badge (green APPROVED / red REJECTED), step number, role, remarks, and timestamp"),
          bullet("Timeline grows as the indent progresses through workflow steps"),
          emptyLine(),

          heading2("6.8 Inline Workflow Configuration"),
          bullet("Site detail page allows Super Admin to manage approval workflow steps directly"),
          bullet("Add Step button creates a new step (disabled when all available roles are used)"),
          bullet("Each step has a role dropdown (Cluster Head or Vice President) and a remove button"),
          bullet("Steps auto-renumber when one is removed"),
          bullet("Save Workflow button persists changes with loading state feedback"),
          emptyLine(),

          heading2("6.9 Multi-Site Role Assignment UI"),
          bullet("User create/edit pages allow adding multiple site-role assignments inline"),
          bullet("Each assignment row has a site dropdown and role dropdown with add/remove controls"),
          bullet("Supports assigning the same user to multiple sites with different roles"),
          emptyLine(),

          heading2("6.10 Procurement Assignment Dialog"),
          bullet("Modal dialog for Head of Procurement to assign approved indents to team members"),
          bullet("Dropdown lists all users with PROCUREMENT_TEAM_MEMBER role"),
          bullet("Shows assignee name and email for identification"),
          bullet("Loading state during assignment with success feedback"),

          // ────────────────────────────────────────
          // 7. PERMISSION SYSTEM
          // ────────────────────────────────────────
          heading1("7. Permission System"),
          para("The application implements a comprehensive permission system with wildcard pattern matching, site-scoped authorization, and helper functions used by every API route and UI component."),
          emptyLine(),

          heading2("13.1 Permission Model"),
          para("Permissions are defined as dot-separated strings with wildcard support. Each role maps to an array of permission strings:"),
          emptyLine(),
          makeTable(
            ["Role", "Permissions"],
            [
              ["Super Admin", "admin.*, indent.read, inventory.read, vendor.read"],
              ["Project Manager", "indent.create, indent.read, indent.edit_own, indent.submit, inventory.read"],
              ["Cluster Head", "indent.read, indent.approve, inventory.read"],
              ["Vice President", "indent.read, indent.approve, inventory.read"],
              ["Head of Procurement", "indent.read, indent.assign, rfq.*, quote.*, po.*, grn.read, vendor.*, inventory.read"],
              ["Procurement Team Member", "indent.read_assigned, rfq.*, quote.*, po.*, grn.read, vendor.read, inventory.read"],
              ["Store Manager", "indent.read, inventory.*, grn.*"],
            ],
            [25, 75]
          ),
          emptyLine(),

          heading2("13.2 Authorization Helper Functions"),
          bullet("canAccess(siteRoles, permission, siteId?) - Checks if any of the user's site roles grant the requested permission, with optional site scoping and wildcard matching"),
          bullet("hasRole(siteRoles, role, siteId?) - Exact role match check, optionally scoped to a specific site"),
          bullet("hasAnyRole(siteRoles, roles[], siteId?) - Checks if user has any role from an array"),
          bullet("isProcurementRole(siteRoles) - Returns true if user is HoP or PTM at any site"),
          bullet("isSiteRole(siteRoles) - Returns true if user is PM, CH, VP, or SM at any site"),
          bullet("getDisplayStatus(status, isProcurement) - Maps internal status to display label based on role type"),
          emptyLine(),

          heading2("13.3 Middleware Route Protection"),
          para("NextAuth middleware protects all authenticated routes. The following URL patterns require a valid session:"),
          bullet("/dashboard/* - Main dashboard and all sub-pages"),
          bullet("/indents/* - Indent list, creation, detail"),
          bullet("/approvals/* - Approval queue and detail"),
          bullet("/procurement/* - RFQ, quotes, purchase orders"),
          bullet("/grn/* - Goods receipt management"),
          bullet("/inventory/* - Inventory viewing"),
          bullet("/admin/* - Site, user, material, vendor administration"),
          para("Unauthenticated users are redirected to /login. Fine-grained role checks happen in individual API routes and server components."),
          emptyLine(),

          heading2("7.4 API Response Standards"),
          para("All API routes use standardized response helpers for consistent error handling:"),
          bullet("success(data) - HTTP 200 with JSON data"),
          bullet("created(data) - HTTP 201 for newly created resources"),
          bullet("unauthorized() - HTTP 401 when no valid session exists"),
          bullet("forbidden() - HTTP 403 when user lacks required role/permission"),
          bullet("notFound(entity) - HTTP 404 with entity-specific message"),
          bullet("badRequest(message) - HTTP 400 for validation errors with descriptive message"),

          // ────────────────────────────────────────
          // 8. AUTO-GENERATED DOCUMENTS
          // ────────────────────────────────────────
          heading1("8. Document Numbering"),
          para("All key documents are assigned auto-generated, human-readable sequential numbers:"),
          emptyLine(),
          makeTable(
            ["Document", "Format", "Example"],
            [
              ["Material Indent", "IND-{SITE_CODE}-{YEAR}-{SEQUENCE}", "IND-MUM01-2026-0042"],
              ["RFQ", "RFQ-{YEAR}-{SEQUENCE}", "RFQ-2026-0015"],
              ["Purchase Order", "PO-{YEAR}-{SEQUENCE}", "PO-2026-0008"],
              ["Goods Receipt Note", "GRN-{SITE_CODE}-{YEAR}-{SEQUENCE}", "GRN-MUM01-2026-0023"],
            ],
            [20, 45, 35]
          ),
          emptyLine(),
          bullet("Sequences are generated atomically within database transactions to prevent duplicates under concurrent access"),
          bullet("Sequences reset per year"),
          bullet("Numbers are zero-padded to 4 digits"),

          // ────────────────────────────────────────
          // 6. DATABASE SCHEMA
          // ────────────────────────────────────────
          heading1("9. Database Schema"),
          para("The system uses 20 database models organized across the following domains:"),
          emptyLine(),
          heading2("13.1 Core Entities"),
          makeTable(
            ["Model", "Description", "Key Fields"],
            [
              ["User", "System users with authentication credentials", "name, email, hashedPassword, phone, isActive"],
              ["UserSiteAssignment", "Maps users to sites with specific roles", "userId, siteId, role (unique constraint on all three)"],
              ["Site", "Physical site locations", "name, code (unique), address, city, state, isActive"],
              ["ApprovalWorkflowStep", "Ordered approval steps per site", "siteId, stepOrder, role (unique per site)"],
              ["Material", "Material catalog", "name, code (unique), category, unit, hsnCode"],
              ["Inventory", "Per-site material stock levels", "siteId, materialId (unique pair), quantity"],
            ],
            [22, 38, 40]
          ),
          emptyLine(),
          heading2("13.2 Indent & Approval Entities"),
          makeTable(
            ["Model", "Description", "Key Fields"],
            [
              ["MaterialIndent", "Material requisition header", "indentNumber, siteId, createdById, status, currentApprovalStep, assignedToId"],
              ["IndentItem", "Line items on an indent", "indentId, materialId, quantity, unit, stockAtCreation"],
              ["IndentApproval", "Approval/rejection actions on indents", "indentId, userId, stepOrder, role, action, remarks, inventorySnapshot (JSON)"],
            ],
            [22, 38, 40]
          ),
          emptyLine(),
          heading2("13.3 Vendor & Procurement Entities"),
          makeTable(
            ["Model", "Description", "Key Fields"],
            [
              ["Vendor", "Supplier directory", "name, code, contactPerson, email, gstNumber, panNumber, bankDetails"],
              ["VendorCategory", "Material categories a vendor supplies", "vendorId, category"],
              ["RFQ", "Request for Quotation header", "rfqNumber, indentId, createdById, status, dueDate"],
              ["RFQItem", "Materials requested in the RFQ", "rfqId, materialId, quantity, unit"],
              ["RFQVendor", "Vendors invited to quote", "rfqId, vendorId, sentAt"],
              ["VendorQuote", "Quote submitted by a vendor", "rfqId, vendorId, status, totalAmount"],
              ["QuoteItem", "Line items in a vendor quote", "quoteId, materialId, unitPrice, gstPercent, totalPrice"],
              ["PurchaseOrder", "Purchase order header", "poNumber, indentId, vendorId, totalAmount, grandTotal"],
              ["POItem", "Line items on a PO", "poId, materialId, quantity, unitPrice, totalPrice"],
              ["GoodsReceipt", "Material delivery record", "grnNumber, poId, siteId, receivedById, status"],
              ["GRNItem", "Materials received in a delivery", "grnId, materialId, orderedQty, receivedQty, acceptedQty, rejectedQty"],
            ],
            [18, 35, 47]
          ),

          // ────────────────────────────────────────
          // 7. API REFERENCE
          // ────────────────────────────────────────
          heading1("10. API Endpoints"),
          para("All API endpoints are implemented as Next.js API route handlers under /api/. Authentication is required for all endpoints except the NextAuth handler."),
          emptyLine(),

          heading2("13.1 Authentication"),
          makeTable(["Method", "Endpoint", "Description"], [["POST", "/api/auth/[...nextauth]", "NextAuth.js handler (login, session, signout)"]], [10, 35, 55]),
          emptyLine(),

          heading2("13.2 Indents (10 endpoints)"),
          makeTable(
            ["Method", "Endpoint", "Description", "Access"],
            [
              ["GET", "/api/indents", "List indents (role-filtered)", "All authenticated"],
              ["POST", "/api/indents", "Create new indent", "Project Manager"],
              ["GET", "/api/indents/[id]", "Get indent detail (visibility-filtered)", "All authenticated"],
              ["PATCH", "/api/indents/[id]", "Update draft indent", "PM (creator only)"],
              ["DELETE", "/api/indents/[id]", "Delete draft indent", "PM (creator only)"],
              ["POST", "/api/indents/[id]/submit", "Submit for approval", "PM (creator only)"],
              ["POST", "/api/indents/[id]/approve", "Approve at current step", "CH, VP (per workflow)"],
              ["POST", "/api/indents/[id]/reject", "Reject with remarks", "CH, VP (per workflow)"],
              ["POST", "/api/indents/[id]/assign", "Assign to PTM", "Head of Procurement"],
            ],
            [8, 28, 34, 30]
          ),
          emptyLine(),

          heading2("13.3 Inventory (2 endpoints)"),
          makeTable(
            ["Method", "Endpoint", "Description", "Access"],
            [
              ["GET", "/api/inventory?siteId=X&materialId=Y", "Get stock level(s)", "All authenticated"],
              ["GET", "/api/inventory/[siteId]", "Get all inventory for a site", "All authenticated"],
            ],
            [8, 35, 32, 25]
          ),
          emptyLine(),

          heading2("13.4 RFQ & Quotes (6 endpoints)"),
          makeTable(
            ["Method", "Endpoint", "Description", "Access"],
            [
              ["GET", "/api/rfq", "List RFQs", "HoP, PTM"],
              ["POST", "/api/rfq", "Create RFQ from indent", "HoP, PTM"],
              ["GET", "/api/rfq/[id]", "Get RFQ detail with quotes", "HoP, PTM"],
              ["GET", "/api/rfq/[id]/quotes", "Get all quotes for RFQ", "HoP, PTM"],
              ["POST", "/api/quotes", "Enter a vendor quote", "HoP, PTM"],
              ["PATCH", "/api/quotes/[id]", "Update quote status", "HoP, PTM"],
            ],
            [8, 28, 34, 30]
          ),
          emptyLine(),

          heading2("12.5 Purchase Orders (3 endpoints)"),
          makeTable(
            ["Method", "Endpoint", "Description", "Access"],
            [
              ["GET", "/api/purchase-orders", "List POs", "HoP, PTM"],
              ["POST", "/api/purchase-orders", "Create PO", "HoP, PTM"],
              ["GET", "/api/purchase-orders/[id]", "PO detail (role-filtered)", "HoP, PTM, SM (limited)"],
            ],
            [8, 30, 32, 30]
          ),
          emptyLine(),

          heading2("11.6 Goods Receipt (4 endpoints)"),
          makeTable(
            ["Method", "Endpoint", "Description", "Access"],
            [
              ["GET", "/api/grn", "List GRNs", "SM, HoP, PTM"],
              ["POST", "/api/grn", "Create GRN", "Store Manager"],
              ["GET", "/api/grn/[id]", "GRN detail", "SM, HoP, PTM"],
              ["POST", "/api/grn/[id]/confirm", "Confirm GRN (update inventory)", "Store Manager"],
            ],
            [8, 28, 34, 30]
          ),
          emptyLine(),

          heading2("11.7 Admin (11 endpoints)"),
          makeTable(
            ["Method", "Endpoint", "Description", "Access"],
            [
              ["GET/POST", "/api/sites", "List / Create sites", "Super Admin"],
              ["GET/PATCH", "/api/sites/[id]", "Get / Update site", "Super Admin"],
              ["GET/PUT", "/api/sites/[id]/workflow", "Get / Set workflow steps", "Super Admin"],
              ["GET/POST", "/api/users", "List / Create users", "Super Admin"],
              ["GET/PATCH", "/api/users/[id]", "Get / Update user", "Super Admin"],
              ["GET/POST", "/api/materials", "List / Create materials", "All / Super Admin"],
              ["PATCH", "/api/materials/[id]", "Update material", "Super Admin"],
              ["GET/POST", "/api/vendors", "List / Create vendors", "SA, HoP / SA, HoP"],
              ["GET/PATCH", "/api/vendors/[id]", "Get / Update vendor", "SA, HoP"],
            ],
            [10, 28, 32, 30]
          ),

          // ────────────────────────────────────────
          // 8. UI PAGES
          // ────────────────────────────────────────
          heading1("11. User Interface Pages"),
          para("The application comprises 29 pages organized into functional areas:"),
          emptyLine(),

          heading2("13.1 Authentication"),
          bullet("/login - Email/password login with error handling and redirect"),
          emptyLine(),

          heading2("13.2 Dashboard"),
          bullet("/dashboard - Role-aware home page with quick action cards, site/role assignments display"),
          emptyLine(),

          heading2("13.3 Indent Pages"),
          bullet("/indents - Indent list with status filtering, role-based action visibility"),
          bullet("/indents/new - Indent creation form with material search, real-time inventory display, priority selection"),
          bullet("/indents/[id] - Indent detail with items table, inventory comparison, approval history, contextual actions"),
          emptyLine(),

          heading2("13.4 Approval Pages"),
          bullet("/approvals - Pending approvals queue showing indents awaiting the current user's action"),
          emptyLine(),

          heading2("12.5 Procurement Pages"),
          bullet("/procurement - Procurement dashboard with unassigned indent queue and active pipeline"),
          bullet("/procurement/rfq - RFQ list with vendor and quote counts"),
          bullet("/procurement/rfq/new - RFQ creation with vendor selection (category-based suggestions)"),
          bullet("/procurement/rfq/[id] - RFQ detail with vendor tracking, quote entry dialog, and quote comparison table"),
          bullet("/procurement/purchase-orders - PO list with amounts and receipt tracking"),
          bullet("/procurement/purchase-orders/new - PO creation with pre-populated data from quotes"),
          bullet("/procurement/purchase-orders/[id] - PO detail with line items, amounts, and GRN history"),
          emptyLine(),

          heading2("11.6 GRN Pages"),
          bullet("/grn - GRN list with PO reference and site information"),
          bullet("/grn/new - GRN creation with PO selection, material receipt entry, vehicle/challan details"),
          bullet("/grn/[id] - GRN detail with confirm action (triggers inventory update)"),
          emptyLine(),

          heading2("11.7 Inventory"),
          bullet("/inventory - Site-selectable inventory view with search and category filtering"),
          emptyLine(),

          heading2("11.8 Admin Pages"),
          bullet("/admin - Admin dashboard with navigation to all admin modules"),
          bullet("/admin/sites - Site list with workflow preview, user counts"),
          bullet("/admin/sites/new - New site creation form"),
          bullet("/admin/sites/[id] - Site detail with workflow configuration (add/remove/reorder steps)"),
          bullet("/admin/users - User list with role/site assignment badges"),
          bullet("/admin/users/new - New user creation with multi-site role assignment"),
          bullet("/admin/users/[id] - User edit with assignment management"),
          bullet("/admin/materials - Material catalog with search functionality"),
          bullet("/admin/materials/new - New material creation with category and unit selection"),
          bullet("/admin/vendors - Vendor directory with category tags"),
          bullet("/admin/vendors/new - New vendor creation with category tagging and bank details"),

          // ────────────────────────────────────────
          // 9. SEED DATA
          // ────────────────────────────────────────
          heading1("12. Test Environment & Seed Data"),
          para("The system includes a comprehensive seed script that populates the database with realistic test data for all functional areas."),
          emptyLine(),

          heading2("13.1 Test Sites (3)"),
          makeTable(
            ["Site Code", "Name", "Location", "Approval Workflow"],
            [
              ["MUM-01", "Mumbai Site 1", "Mumbai, Maharashtra", "Cluster Head -> Vice President (2-step)"],
              ["DEL-01", "Delhi Site 1", "Delhi NCR, Delhi", "Vice President only (1-step, no CH)"],
              ["BLR-01", "Bangalore Site 1", "Bangalore, Karnataka", "Cluster Head -> Vice President (2-step)"],
            ],
            [12, 20, 25, 43]
          ),
          emptyLine(),

          heading2("13.2 Test Users (10)"),
          para("All test accounts use the password: password123"),
          emptyLine(),
          makeTable(
            ["Email", "Name", "Role", "Sites"],
            [
              ["admin@procure.com", "System Admin", "Super Admin", "All sites"],
              ["pm.mumbai@procure.com", "Rajesh Kumar", "Project Manager", "MUM-01"],
              ["pm.delhi@procure.com", "Suresh Sharma", "Project Manager", "DEL-01"],
              ["ch.mumbai@procure.com", "Priya Patel", "Cluster Head", "MUM-01, BLR-01"],
              ["vp@procure.com", "Anil Mehta", "Vice President", "All sites"],
              ["hop@procure.com", "Meera Singh", "Head of Procurement", "All sites"],
              ["buyer1@procure.com", "Amit Desai", "Procurement Team Member", "MUM-01, DEL-01"],
              ["buyer2@procure.com", "Sneha Reddy", "Procurement Team Member", "MUM-01, BLR-01"],
              ["store.mumbai@procure.com", "Ramesh Iyer", "Store Manager", "MUM-01"],
              ["store.delhi@procure.com", "Vikram Tiwari", "Store Manager", "DEL-01"],
            ],
            [25, 18, 22, 35]
          ),
          emptyLine(),

          heading2("13.3 Test Materials (20)"),
          para("The seed includes 20 construction materials across categories: Cement (2), Steel (3), Sand & Aggregate (3), Bricks & Blocks (2), Plywood (2), Electrical (2), Plumbing (2), Finishing (3), Tiles (1)."),
          emptyLine(),

          heading2("13.4 Test Vendors (5)"),
          makeTable(
            ["Vendor", "Categories"],
            [
              ["UltraTech Cement Ltd", "Cement"],
              ["Tata Steel Dealers", "Steel"],
              ["BuildMart Supplies", "Sand & Aggregate, Bricks & Blocks"],
              ["Havells India Ltd", "Electrical"],
              ["Supreme Industries", "Plumbing"],
            ],
            [40, 60]
          ),
          emptyLine(),

          heading2("12.5 Sample Inventory"),
          para("Mumbai Site (MUM-01) is pre-loaded with inventory for 8 materials including 500 bags of OPC Cement, 25 tonnes of 8mm TMT Steel, 10,000 red bricks, and more."),

          // ────────────────────────────────────────
          // 10. DEPLOYMENT
          // ────────────────────────────────────────
          heading1("13. Deployment Guide"),

          heading2("13.1 Prerequisites"),
          bullet("Node.js 18+ installed"),
          bullet("PostgreSQL database (local or Neon cloud)"),
          bullet("Vercel account (for production deployment)"),
          emptyLine(),

          heading2("13.2 Local Development Setup"),
          bullet("1. Clone the repository"),
          bullet("2. Copy .env.example to .env.local and configure DATABASE_URL and NEXTAUTH_SECRET"),
          bullet("3. Run: npm install"),
          bullet("4. Run: npx prisma migrate dev --name init"),
          bullet("5. Run: npm run db:seed"),
          bullet("6. Run: npm run dev"),
          bullet("7. Open http://localhost:3000 and login with any test account"),
          emptyLine(),

          heading2("13.3 Production Deployment (Vercel)"),
          bullet("1. Create a Neon PostgreSQL project and database"),
          bullet("2. Set environment variables in Vercel dashboard: DATABASE_URL, DIRECT_DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET"),
          bullet("3. Connect Git repository to Vercel for automatic deployments"),
          bullet("4. Run npx prisma migrate deploy against production database"),
          bullet("5. Run seed script against production database for initial data"),
          emptyLine(),

          heading2("13.4 Environment Variables"),
          makeTable(
            ["Variable", "Description", "Example"],
            [
              ["DATABASE_URL", "PostgreSQL connection string (pooled)", "postgresql://user:pass@host/db?sslmode=require"],
              ["DIRECT_DATABASE_URL", "Direct connection for Prisma migrations", "postgresql://user:pass@host/db?sslmode=require"],
              ["NEXTAUTH_URL", "Application base URL", "https://your-app.vercel.app"],
              ["NEXTAUTH_SECRET", "JWT signing secret", "Generate with: openssl rand -base64 32"],
            ],
            [20, 40, 40]
          ),

          // ────────────────────────────────────────
          // 11. END-TO-END WORKFLOW
          // ────────────────────────────────────────
          heading1("14. End-to-End Workflow Example"),
          para("This section walks through a complete procurement cycle from indent creation to material receipt at site."),
          emptyLine(),

          heading3("Step 1: Project Manager Creates Indent"),
          bullet("Rajesh Kumar (PM, Mumbai) logs in and navigates to Indents > New Indent"),
          bullet("Selects site MUM-01, adds 100 bags of OPC Cement and 10 tonnes of 12mm TMT Steel"),
          bullet("System shows current stock: 500 bags cement, 40 tonnes steel already at site"),
          bullet("Sets priority to URGENT with required date of next month"),
          bullet("Saves as draft, then clicks 'Submit for Approval'"),
          emptyLine(),

          heading3("Step 2: Cluster Head Approves"),
          bullet("Priya Patel (CH, Mumbai) sees the indent in her Approvals queue"),
          bullet("Reviews material quantities and current inventory levels"),
          bullet("Adds remarks: 'Approved. Required for Phase 2 construction.' and clicks Approve"),
          bullet("System advances to Step 2 (Vice President)"),
          emptyLine(),

          heading3("Step 3: Vice President Approves"),
          bullet("Anil Mehta (VP) sees the indent in his Approvals queue"),
          bullet("Reviews and approves. Indent status becomes APPROVED"),
          emptyLine(),

          heading3("Step 4: Head of Procurement Assigns"),
          bullet("Meera Singh (HoP) sees the indent in the Procurement dashboard under 'Unassigned'"),
          bullet("Assigns it to Amit Desai (Buyer 1)"),
          emptyLine(),

          heading3("Step 5: Buyer Creates RFQ"),
          bullet("Amit Desai navigates to the indent and clicks 'Create RFQ'"),
          bullet("System suggests UltraTech (Cement) and Tata Steel Dealers (Steel)"),
          bullet("Amit selects both vendors and creates the RFQ"),
          emptyLine(),

          heading3("Step 6: Buyer Enters Vendor Quotes"),
          bullet("As quotes come in from vendors, Amit enters them via the RFQ detail page"),
          bullet("Enters UltraTech's quote: Cement at Rs 380/bag"),
          bullet("Enters Tata Steel's quote: 12mm TMT at Rs 55,000/tonne"),
          bullet("Quote comparison table highlights best prices"),
          emptyLine(),

          heading3("Step 7: Buyer Creates Purchase Order"),
          bullet("Amit creates a PO from the indent, selecting the best vendor rates"),
          bullet("PO is auto-populated with quantities and rates from selected quotes"),
          bullet("Sets delivery date and confirms. PO-2026-0001 is issued"),
          emptyLine(),

          heading3("Step 8: Store Manager Records Delivery"),
          bullet("When materials arrive at Mumbai site, Ramesh Iyer (Store Manager) creates a new GRN"),
          bullet("Selects PO-2026-0001, enters received quantities (95 bags cement, 10 tonnes steel)"),
          bullet("Accepts 95 bags (5 bags damaged = rejected), all steel accepted"),
          bullet("Records vehicle number and challan number"),
          emptyLine(),

          heading3("Step 9: Store Manager Confirms GRN"),
          bullet("Ramesh clicks 'Confirm GRN & Update Inventory'"),
          bullet("System atomically updates Mumbai site inventory: Cement 500 + 95 = 595 bags, Steel 40 + 10 = 50 tonnes"),
          bullet("PO status updates to PARTIALLY_RECEIVED (cement was 95/100)"),
          bullet("Rajesh (PM) sees indent status change to 'Partially Delivered'"),
          emptyLine(),

          para("Throughout this entire flow, Rajesh (PM), Priya (CH), and Anil (VP) can track the indent's progress through simplified status labels but never see the PO amounts, vendor rates, or quote details."),

          emptyLine(),
          emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
            children: [new TextRun({ text: "--- End of Document ---", italics: true, size: 20, color: GRAY, font: "Calibri" })],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("ProCure_Product_Documentation.docx", buffer);
  console.log("Document generated: ProCure_Product_Documentation.docx");
}

main();
