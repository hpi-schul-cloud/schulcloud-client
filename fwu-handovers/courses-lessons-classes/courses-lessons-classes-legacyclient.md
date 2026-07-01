# Technical Handover: Courses, Lessons & Classes (Legacy Client)

## Document Purpose & Structure

This document guides new developers through the Course, Lesson (Topic), and Class features as implemented in this **legacy Express/Handlebars client**. It's designed to be presented by someone familiar with the code, not read in isolation.

**Prerequisite:** You should have completed the general introduction to the codebase, the Express/Handlebars architecture, and the server-side rendering patterns used in this project.

**Related documents:**
- *Courses, Lessons & Classes (Vue Client)* — covers the read/display views (dashboard grid, course room board, admin tables)
- *Course Module (Server)* — covers the NestJS/Feathers backend
- *Lesson Module (Server)* — covers the backend lesson implementation
- *Class Module (Server)* — covers the backend class implementation

---

## 1. Role of This Client

### 1.1 What This Client Handles

This legacy client is the **primary mutation interface** for courses, lessons, and classes. It handles the forms and workflows for creating, editing, and managing these entities.

| Feature Area | What This Client Does |
|---|---|
| **Courses** | Create form, edit form, copy form, delete, calendar events, student enrollment via link, groups tab |
| **Lessons** | Create/edit form (React content-block editor), view lesson content, sharing, material management |
| **Classes** | Create, edit, manage members, successor/upgrade, delete |
| **CourseGroups** | Create/edit sub-groups within courses, view group content |

### 1.2 What This Client Does NOT Do

Several **read-only views** have been migrated to the Vue client in a separate repository:

| Feature | Where It Lives Now |
|---|---|
| Course dashboard grid (active courses) | Vue client: `/rooms/courses-overview` |
| Course room details (legacy board) | Vue client: `/rooms/:id` |
| Course admin table | Vue client: `/administration/rooms/new` |
| Class admin table | Vue client: `/administration/groups/classes` |
| Task overview page | Vue client: `/tasks` |

The Vue client links **back to this client** for create/edit operations using `href` navigation (not SPA routing). This means the user leaves the Vue SPA, performs the mutation here, and is redirected back.

### 1.3 Routing & Navigation Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Vue Client (Read/Display)                                                │
│                                                                          │
│  /rooms/courses-overview  → Dashboard grid                               │
│  /rooms/:id               → Course room (board view)                     │
│  /administration/...      → Admin tables                                 │
│                                                                          │
│  User clicks "Add Lesson" / "Edit Course" / "Create Class" etc.          │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │ href (leaves SPA)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  This Legacy Client (Mutation Forms)                                      │
│                                                                          │
│  /courses/:id/edit          → Edit course form                           │
│  /courses/:id/topics/add    → Create lesson form                         │
│  /courses/:id/topics/:id/edit → Edit lesson form                         │
│  /administration/classes/create → Create class form                       │
│  /administration/classes/:id/manage → Manage class members                │
│                                                                          │
│  After submit → redirect back (often via ?returnUrl= or referrer)        │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Key Architectural Patterns

| Pattern | Description |
|---|---|
| **Server-side rendering** | Express routes render Handlebars (`.hbs`) templates |
| **API proxy** | Controller functions call the backend via `api(req)` helper (Feathers API) or `api(req, { version: 'v3' })` (NestJS API) |
| **Form submission** | HTML forms POST/PATCH to Express routes, which proxy to the backend API |
| **Client-side JS** | jQuery + React (for topic editor only) enhance the rendered pages |
| **Permission checks** | Done both server-side (middleware/hooks) and template-side (Handlebars helpers like `{{#inArray}}`) |

---

## 2. Module & File Structure

### 2.1 Key Directories

```
controllers/
├── courses.js              # Course CRUD routes + calendar events
├── coursegroups.js          # CourseGroup sub-routes (mounted under /courses/:courseId/groups/)
├── topics.js               # Lesson/Topic routes (mounted under /courses/:courseId/topics/)
├── homework.js             # Task/Homework routes (covered in separate handover)
├── administration.js       # Admin routes including classes (large file, multi-purpose)
└── index.js                # Route mounting (shows the URL hierarchy)

views/
├── courses/
│   ├── course.hbs              # Course detail page (groups tab)
│   ├── create-course.hbs       # Multi-step course creation wizard
│   ├── edit-course.hbs         # Course edit form
│   ├── courseGroup.hbs          # CourseGroup detail view
│   ├── edit-courseGroup.hbs     # CourseGroup edit form
│   ├── components/
│   │   ├── groups.hbs              # Groups tab content
│   │   ├── courseGroup-card.hbs     # Single group card
│   │   └── svg_*.hbs               # Tab icons
│   └── forms/
│       ├── form-invitation.hbs     # Invitation link modal
│       ├── form-share.hbs          # Course sharing modal
│       └── form-import-course.hbs  # Course import modal
├── topic/
│   ├── topic.hbs               # Lesson display view
│   ├── edit-topic.hbs          # Lesson editor (React content blocks)
│   ├── components/
│   │   ├── content-text.hbs        # Text content component
│   │   ├── content-Etherpad.hbs    # Etherpad component
│   │   ├── content-geoGebra.hbs    # GeoGebra component
│   │   ├── content-internal.hbs    # Internal link component
│   │   └── content-resources.hbs   # Lernstore resources component
│   └── forms/
│       └── form-share.hbs         # Topic sharing modal
├── administration/
│   ├── classes-edit.hbs         # Class create/edit form
│   ├── classes-manage.hbs       # Class member management
│   └── administration.hbs       # Main admin layout
└── homework/
    ├── edit.hbs                 # Task create/edit form
    ├── assignment.hbs           # Task detail/grading view
    └── ...                      # (Covered in separate handover)

static/scripts/
├── courses.js              # Course page interactivity (drag topics, invitation links)
├── topicEdit.js            # React-based lesson content block editor (~950 lines)
├── topic.js                # Topic view utilities (iframe resize, math rendering)
├── coursesTimes.js          # Course time/schedule form management
└── coursesOverview.js       # Course overview page scripts
```

### 2.2 Route Mounting (from [`controllers/index.js`](../../controllers/index.js))

```javascript
router.use('/courses/', require('./courses'));
router.use('/courses/:courseId/topics/', require('./topics'));
router.use('/courses/:courseId/groups/', require('./coursegroups'));
router.use('/homework/', require('./homework'));
router.use('/administration/', require('./administration'));
```

This means:
- `/courses/` → [`controllers/courses.js`](../../controllers/courses.js)
- `/courses/:courseId/topics/` → [`controllers/topics.js`](../../controllers/topics.js) (with `mergeParams: true`)
- `/courses/:courseId/groups/` → [`controllers/coursegroups.js`](../../controllers/coursegroups.js) (with `mergeParams: true`)
- `/administration/` → [`controllers/administration.js`](../../controllers/administration.js)

---

## 3. Courses

### 3.1 Overview

📁 [`controllers/courses.js`](../../controllers/courses.js) (881 lines)

The course controller handles the full lifecycle of courses: creation, editing, copying, deletion, and calendar event management. It also handles the "Groups" tab view (the only tab still served by this client).

### 3.2 Route Map

| Method | Route | Handler | Purpose |
|---|---|---|---|
| GET | `/courses/` | redirect | Redirects to `/rooms-overview` (Vue client) |
| GET | `/courses/getNames` | inline | Returns JSON list of course names (for dropdowns) |
| GET | `/courses/add/` | `editCourseHandler` | Render create-course form |
| POST | `/courses/` | inline | Create a new course + calendar events |
| GET | `/courses/:courseId/` | inline | Course detail page (Groups tab only) |
| GET | `/courses/:courseId/edit` | `editCourseHandler` | Render edit-course form |
| GET | `/courses/:courseId/copy` | `copyCourseHandler` | Render copy-course form |
| GET | `/courses/:courseId/json` | inline | JSON endpoint: course + lessons data |
| GET | `/courses/:courseId/usersJson` | inline | JSON endpoint: course with populated users |
| PATCH | `/courses/:courseId` | inline | Update course + recreate calendar events |
| PATCH | `/courses/:courseId/positions` | inline | Update lesson positions (drag-and-drop reorder) |
| DELETE | `/courses/:courseId` | inline | Delete course + its calendar events |
| GET | `/courses/:courseId/addStudent` | inline | Student self-enrollment via invitation link |

### 3.3 Course Creation Flow

**Route:** `GET /courses/add/` → `POST /courses/`

The [`editCourseHandler`](../../controllers/courses.js) function renders the creation form. Key data loading:

```
editCourseHandler(req, res, next)
    ├─► Load classes/groups list (depends on FEATURE_GROUPS_IN_COURSE_ENABLED flag)
    ├─► Load teachers list
    ├─► Load students list
    ├─► If syncedGroupId query param → load group data for pre-population
    │
    └─► Render 'courses/create-course' with:
        - Color palette options
        - Class/group multiselect (pre-selected if synced)
        - Teacher multiselect (current user pre-selected)
        - Student multiselect (filtered by STUDENT_LIST permission)
        - Start/end dates (defaults from school year)
        - Sync-related fields (if applicable)
```

**POST handler** transforms form data before proxying to the backend:
1. Converts time fields (HH:mm → milliseconds, duration × 60 × 1000)
2. Parses date strings to Date objects
3. Splits comma-separated ID strings into arrays
4. Extracts feature flags (messenger, videoconference)
5. POSTs to Feathers `/courses/` API
6. Creates calendar events for each time slot

### 3.4 Course Edit Flow

**Route:** `GET /courses/:courseId/edit` → `PATCH /courses/:courseId`

Uses the same `editCourseHandler` but:
- Loads existing course data
- Checks `COURSE_EDIT` scope permission
- Renders [`courses/edit-course`](../../views/courses/edit-course.hbs) template instead of create

**PATCH handler** notable logic:
- If the current user removes themselves from the course's teacher/substitution lists, they are temporarily kept to maintain permission for calendar event recreation, then removed in a follow-up patch
- Handles "unarchive" separately (only sends `untilDate`)
- Deletes all calendar events and recreates them (instead of diffing)

### 3.5 Course Copy Flow

**Route:** `GET /courses/:courseId/copy`

[`copyCourseHandler`](../../controllers/courses.js) loads the course and renders the edit form pre-filled with:
- Course name appended with " - Kopie"
- Same teachers, classes
- No students pre-selected
- `isArchived` set to false

The form submits to `POST /courses/copy/:courseId` which creates a new course. This is the **legacy** copy – the Vue client uses the NestJS deep-copy endpoint (`POST /course-rooms/:id/copy`) which also copies lessons, tasks, and boards.

### 3.6 Course Deletion

**Route:** `DELETE /courses/:courseId`

1. Deletes calendar events via `DELETE /calendar/courses/:courseId`
2. Deletes the course via Feathers `DELETE /courses/:courseId`
3. Returns 200

**Note:** The Feathers backend hooks handle cascading cleanup (boards, external tools).

### 3.7 Calendar Event Integration

Courses have scheduled time slots. This client manages the calendar integration:

- [`createEventsForCourse(req, res, course)`](../../controllers/courses.js) – Creates recurring weekly calendar events
- [`deleteEventsForCourse(req, res, courseId)`](../../controllers/courses.js) – Removes all events for a course
- Gated by `CALENDAR_SERVICE_ENABLED` configuration

Each time slot becomes a weekly recurring event with: summary (course name), location (room), frequency (WEEKLY), weekday, duration, and repeat_until.

### 3.8 Course Groups Tab

**Route:** `GET /courses/:courseId/?activeTab=groups`

This is the only tab still served by this client. The "Learn Content" and "Tools" tabs redirect:
- `?activeTab=tools` → redirects to `/rooms/:id?tab=tools` (Vue client)
- No valid activeTab → redirects to `/rooms/:id` (Vue client)

The groups tab renders a list of CourseGroups (sub-groups of students within a course). See [`views/courses/course.hbs`](../../views/courses/course.hbs).

### 3.9 Course Sync with External Groups

When `FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED` is active, courses can be synced with external groups from provisioning systems. The `editCourseHandler` supports this via:

- `?syncedGroupId=` query parameter triggers pre-population from group data
- The form displays synced fields as read-only
- `excludeFromSync` array (currently only `'teachers'`) controls which attributes are managed externally
- The [`getSyncedElements()`](../../controllers/courses.js) function extracts pre-selected values for disabled form fields

### 3.10 Student Self-Enrollment

**Route:** `GET /courses/:courseId/addStudent?link=...`

Handles invitation-link-based enrollment:
1. Verifies the current user is a student
2. Checks if already enrolled
3. Adds user to `userIds` array via PATCH
4. Redirects to course room

### 3.11 Feature Flags (Courses)

| Flag | Purpose |
|---|---|
| `FEATURE_GROUPS_IN_COURSE_ENABLED` | Use merged class/group list (v3 API) vs. legacy class list (v1) |
| `FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED` | Enable sync with external groups |
| `CALENDAR_SERVICE_ENABLED` | Enable calendar event creation |

---

## 4. Lessons (Topics)

### 4.1 Overview

📁 [`controllers/topics.js`](../../controllers/topics.js) (382 lines)

Lessons are called "Topics" in the URL structure (`/courses/:courseId/topics/`) and "Themen" in German. This controller handles lesson creation, editing, viewing, and deletion.

**Important:** The lesson editor uses a **React-based content block system** ([`static/scripts/topicEdit.js`](../../static/scripts/topicEdit.js)) rendered client-side within the Handlebars template.

### 4.2 Route Map

| Method | Route | Handler | Purpose |
|---|---|---|---|
| GET | `/` | redirect | Redirects to `/courses/:courseId` |
| GET | `/add` | `editTopicHandler` | Render create-lesson form |
| POST | `/` | inline | Create a new lesson |
| GET | `/:topicId` | inline | View lesson content |
| GET | `/:topicId/edit` | `editTopicHandler` | Render edit-lesson form |
| PATCH | `/:topicId` | inline | Update lesson (full or visibility toggle) |
| DELETE | `/:topicId` | inline | Delete lesson (via NestJS v3 API) |
| POST | `/:id/share` | inline | Generate/get share token |
| DELETE | `/:topicId/materials/:materialId` | inline | Remove material from lesson |

### 4.3 Lesson Editor (Create/Edit)

**Route:** `GET /courses/:courseId/topics/add` or `GET /courses/:courseId/topics/:topicId/edit`

The [`editTopicHandler`](../../controllers/topics.js) function:
1. Loads existing lesson via NestJS API (`GET /v3/lessons/:id`) or creates empty object
2. Initializes file storage context
3. Decodes HTML entities in title and contents
4. Renders [`topic/edit-topic`](../../views/topic/edit-topic.hbs) template

The template loads the **React content block editor** ([`topicEdit.js`](../../static/scripts/topicEdit.js)), which provides:
- Drag-and-drop reordering of content blocks
- Content type selection (Text, Etherpad, GeoGebra, Internal Link, Lernstore)
- Per-block visibility toggle
- Per-block title
- Rich text editing (CKEditor for text blocks)

### 4.4 Content Block Types

The React editor (`topicEdit.js`) supports these block types:

| Type | Component | What It Renders |
|---|---|---|
| `text` | `TopicText` | CKEditor rich text editor |
| `Etherpad` | `TopicEtherpad` | Etherpad pad creation (auto-generates pad on save) |
| `geoGebra` | `TopicGeoGebra` | GeoGebra material ID input |
| `internal` | `TopicInternal` | URL input for internal resources |
| `resources` | `TopicLernstore` | Lernstore resource picker (opens search dialog) |

### 4.5 Lesson Creation Flow

**Route:** `POST /courses/:courseId/topics/`

1. Checks for Etherpad components → creates pads via `POST /etherpad/pads`
2. Filters out undefined contents
3. Validates internal component URLs against allowed patterns
4. POSTs to Feathers `POST /lessons/`
5. Redirects to the edit page of the newly created lesson

### 4.6 Lesson Update Flow

**Route:** `PATCH /courses/:courseId/topics/:topicId`

Handles two modes:
- **Full update** (form submission): Processes content blocks, creates new Etherpads, validates internal URLs
- **Simple toggle** (`?json=true` query): Patches `hidden` or `position` fields only, returns JSON response (used by jQuery AJAX from the course page)

### 4.7 Lesson View

**Route:** `GET /courses/:courseId/topics/:topicId`

Loads and renders a lesson with all its content:
1. Fetches course, lesson (v3 API), homework for this lesson, and optional courseGroup
2. For Etherpad components: extracts pad IDs and creates Etherpad sessions (sets cookies)
3. Decodes HTML entities in content titles
4. Transforms component type strings into partial paths (e.g., `'text'` → [`topic/components/content-text`](../../views/topic/components/content-text.hbs))
5. Renders with breadcrumbs, role-based permissions, and linked tasks

### 4.8 Etherpad Integration

The Etherpad flow for lessons:
1. **Creation:** When saving a lesson with an Etherpad block, [`createNewEtherpad()`](../../controllers/topics.js) calls `POST /etherpad/pads` to create the pad
2. **Viewing:** [`getEtherpadSession()`](../../controllers/topics.js) calls `POST /etherpad/sessions` to authenticate the user
3. **Cookie:** [`authHelper.etherpadCookieHelper()`](../../helpers/authentication.js) sets the session cookie for pad access
4. **URL validation:** [`validatePadDomain()`](../../controllers/topics.js) checks against the configured `ETHERPAD__DOMAIN`

### 4.9 Lesson Deletion

**Route:** `DELETE /courses/:courseId/topics/:topicId`

Calls the NestJS API: `DELETE /v3/lessons/:topicId`. The backend handles cascade deletion of files and linked tasks.

### 4.10 Material Management

**Route:** `DELETE /courses/:courseId/topics/:topicId/materials/:materialId`

Removes a Lernstore material from a lesson:
1. Patches lesson to `$pull` the material ID from `materialIds`
2. Deletes the material document

### 4.11 Sharing

**Route:** `POST /courses/:courseId/topics/:id/share`

If the lesson doesn't already have a `shareToken`, generates one via `shortId.generate()` and patches it onto the lesson.

---

## 5. Course Groups

### 5.1 Overview

📁 [`controllers/coursegroups.js`](../../controllers/coursegroups.js) (205 lines)

CourseGroups are sub-groups of students within a course (e.g., project teams). They can own their own lessons and track team submissions.

### 5.2 Route Map

| Method | Route | Handler | Purpose |
|---|---|---|---|
| GET | `/add` | `editCourseGroupHandler` | Render create-group form |
| POST | `/` | inline | Create a new course group |
| GET | `/:courseGroupId/` | inline | View group detail (lessons + submissions) |
| GET | `/:courseGroupId/edit` | `editCourseGroupHandler` | Render edit-group form |
| PATCH | `/:courseGroupId` | inline | Update group members |
| DELETE | `/:courseGroupId` | inline | Delete group |

### 5.3 Key Behaviors

- **Auto-enrollment:** If the current user is a student (not teacher), they are automatically added to the group on creation
- **Student list:** Shows only students enrolled in the parent course
- **Group detail view:** Displays group lessons, completed team submissions, and open team homework (see [`views/courses/courseGroup.hbs`](../../views/courses/courseGroup.hbs))
- **Permission gating:** Only teachers with `COURSE_EDIT` see all groups; students see only groups they belong to

---

## 6. Classes (Administration)

### 6.1 Overview

📁 [`controllers/administration.js`](../../controllers/administration.js) (relevant sections: ~lines 1020–1480)

Class management is embedded within the larger administration controller. This handles creation, editing, member management, and the year-upgrade (successor) flow.

### 6.2 Route Map

| Method | Route | Handler | Purpose |
|---|---|---|---|
| GET | `/classes/create` | `renderClassEdit` | Render class creation form |
| POST | `/classes/create` | inline | Create a new class |
| GET | `/classes/:classId/edit` | `renderClassEdit` | Render class edit form |
| POST | `/classes/:classId/edit` | inline | Update class metadata |
| GET | `/classes/:classId/createSuccessor` | `renderClassEdit` | Render year-upgrade form |
| GET | `/classes/:id` | `getDetailHandler` | View class details |
| PATCH | `/classes/:id` | inline | Patch class fields |
| DELETE | `/classes/:id` | inline | Delete class |
| GET | `/classes/:classId/manage` | inline | Render member management page |
| POST | `/classes/:classId/manage` | inline | Update class members |
| GET | `/classes/students?classes=[...]` | inline | Get students from multiple classes (JSON) |

### 6.3 Class Create/Edit Form

📁 [`renderClassEdit`](../../controllers/administration.js) function (line 1021)

A shared handler for create, edit, and upgrade modes (renders [`views/administration/classes-edit.hbs`](../../views/administration/classes-edit.hbs)). Loads:
- Teachers list (for teacher assignment)
- Grade levels (1–13)
- School years (from school data)
- Existing class data (for edit/upgrade)

**Form modes:**

| Mode | Source of data | Action URL |
|---|---|---|
| `create` | Empty | `/administration/classes/create` |
| `edit` | `GET /classes/:classId` | `/administration/classes/:classId/edit` |
| `upgrade` | `GET /classes/successor/:classId` | `/administration/classes/create` (creates new) |

**Class naming:**
- **Standard class:** `gradeLevel` (1–13) + `name` suffix (e.g., grade=7, suffix="a" → "7a")
- **Custom class:** Free-form `name` without grade level (e.g., "DaZ Kurs")

### 6.4 Class Creation

**Route:** `POST /administration/classes/create`

```
Request body → newClass object:
    ├─ schoolId
    ├─ predecessor (optional, for upgrades)
    ├─ If custom: name = classcustom, optional year
    ├─ If standard: name = classsuffix, gradeLevel = grade, year = schoolyear
    ├─ teacherIds (optional)
    └─ userIds (optional)

→ POST /classes/ (Feathers API)
→ Redirect to /administration/groups/classes/ (admin) or /administration/classes/:id/manage (teacher)
```

### 6.5 Class Member Management

**Route:** `GET /administration/classes/:classId/manage`

Renders a page where teachers and students can be added/removed from a class (see [`views/administration/classes-manage.hbs`](../../views/administration/classes-manage.hbs)):
- Loads current class with populated `teacherIds` and `userIds`
- Shows teachers list with pre-selected current members
- Shows students list with pre-selected current members (filtered by `STUDENT_LIST` permission)
- Identifies students without consent (for registration reminders)
- Displays contextual notes about registration and consent workflows

**Submission:** `POST /administration/classes/:classId/manage` patches the class with new `teacherIds` and `userIds`.

### 6.6 Year Upgrade (Successor)

**Route:** `GET /administration/classes/:classId/createSuccessor`

Uses the Feathers `GET /classes/successor/:classId` endpoint to compute a suggested successor:
- Grade level incremented by 1
- Next school year
- Same teachers and students
- Checks for duplicates

The form renders in "upgrade" mode, pre-filled with the suggestion. Submission creates a new class with `predecessor` set, which triggers the Feathers after-hook to link the old class's `successor` field.

**Upgradability conditions:**
- Class has a year assigned
- Grade level exists and is < 13
- No successor already exists
- Not the last defined school year

### 6.7 Class Deletion

**Route:** `DELETE /administration/classes/:id` or `DELETE /administration/:classId/`

Two delete routes exist (historical reasons). Both call `DELETE /classes/:id` on the Feathers API.

### 6.8 Permission Model

| Route | Required Permission |
|---|---|
| Create | `ADMIN_VIEW` OR `CLASS_CREATE` |
| Edit | `ADMIN_VIEW` OR `CLASS_EDIT` |
| Manage members | `ADMIN_VIEW` OR `CLASS_EDIT` |
| Delete | `ADMIN_VIEW` OR `CLASS_REMOVE` |
| View students | `ADMIN_VIEW` OR `CLASS_EDIT` |

---

## 7. API Calls Summary

### 7.1 Backend APIs Used

| API | Version | Used For |
|---|---|---|
| `/courses` | v1 (Feathers) | Course CRUD, enrollment |
| `/classes` | v1 (Feathers) | Class CRUD, member management |
| `/classes/successor` | v1 (Feathers) | Year-upgrade computation |
| `/lessons` | v1 (Feathers) | Lesson CRUD (create, patch) |
| `/lessons/:id` | v3 (NestJS) | Lesson GET (for edit form), DELETE |
| `/courseGroups` | v1 (Feathers) | CourseGroup CRUD |
| `/groups/class` | v3 (NestJS) | Merged class/group list (for course form) |
| `/groups/:id` | v3 (NestJS) | Single group details (for sync pre-population) |
| `/calendar` | v1 (Feathers) | Calendar event CRUD |
| `/etherpad/pads` | v1 (Feathers) | Etherpad pad creation |
| `/etherpad/sessions` | v1 (Feathers) | Etherpad session authentication |
| `/coursesUserPermissions/:id` | v1 (Feathers) | Scope-based permission check |
| `/homework` | v1 (Feathers) | Linked tasks for lesson view |
| `/users/:id/courses` | v1 (Feathers) | User's courses (for dropdowns) |
| `/materials/:id` | v1 (Feathers) | Material deletion |

### 7.2 API Helper Usage

```javascript
// Feathers (v1) call
api(req).get('/courses/:id');
api(req).post('/courses/', { json: body });
api(req).patch('/courses/:id', { json: body });
api(req).delete('/courses/:id');

// NestJS (v3) call
api(req, { version: 'v3' }).get('/lessons/:id');
api(req, { version: 'v3' }).delete('/lessons/:id');
api(req, { version: 'v3' }).get('/groups/class', { qs: { limit: -1 } });
```

---

## 8. Client-Side JavaScript

### 8.1 Course Page Scripts ([`static/scripts/courses.js`](../../static/scripts/courses.js))

jQuery-based interactivity for the course detail page:
- **Lesson visibility toggle:** AJAX PATCH to toggle `hidden` on lessons
- **Invitation link generation:** Creates and displays shareable enrollment links
- **Lesson reorder:** jQuery UI Sortable for drag-and-drop lesson ordering
- **Form validation:** Start/end date validation, teacher selection requirement

### 8.2 Topic Editor ([`static/scripts/topicEdit.js`](../../static/scripts/topicEdit.js))

A **954-line React application** that provides the content block editor:

**Architecture:**
```
TopicBlockList (SortableContainer)
  └── TopicBlock (SortableElement)
      └── TopicBlockWrapper
          └── [ContentType Component]
              ├── TopicText (CKEditor)
              ├── TopicEtherpad (title + description)
              ├── TopicGeoGebra (material ID input)
              ├── TopicInternal (URL input)
              └── TopicLernstore (resource picker)
```

**Key features:**
- React Sortable HOC for drag-and-drop reordering
- CKEditor integration for rich text editing
- Dynamic add/remove of content blocks
- Hidden state toggle per block
- Serialization to hidden form fields (submitted with the HTML form)

### 8.3 Topic View Scripts ([`static/scripts/topic.js`](../../static/scripts/topic.js))

Minimal: iframe resizing and MathJax rendering on page load.

---

## 9. Cross-Cutting Concerns

### 9.1 Authentication & Authorization

All routes use [`authHelper.authChecker`](../../helpers/authentication.js) middleware. Additionally:
- Course scope permissions are loaded via `/coursesUserPermissions/:courseId`
- Templates conditionally render UI elements with `{{#inArray "COURSE_EDIT" scopedCoursePermission}}`
- Administration routes use [`permissionsHelper.permissionsChecker()`](../../helpers/permissions.js)

### 9.2 Data Transformation Patterns

Several recurring patterns in the controllers:

| Pattern | Purpose |
|---|---|
| `strToPropsArray(body, keys)` | Converts comma-separated form strings to arrays |
| `markSelected(options, values)` | Marks selected items for multiselect rendering |
| `filterStudents(ctx, students)` | Filters student list based on `STUDENT_LIST` permission |
| `timesHelper.fromUTC(date)` | Converts UTC dates to display format |
| `decode(html)` | Decodes HTML entities for safe display in input fields |

### 9.3 Redirect Patterns

| Pattern | Usage |
|---|---|
| `?redirectUrl=` | Passed through to redirect after form submission |
| `?returnUrl=` | Used by Vue client to specify where to return |
| `redirectHelper.safeBackRedirect(req, res)` | Redirect to referrer safely |
| `res.redirect(303, url)` | POST-redirect-GET pattern after PATCH |

### 9.4 Error Handling

Most handlers use `.catch(next)` to pass errors to Express error middleware. Some operations use session notifications:
```javascript
req.session.notification = {
    type: 'danger',
    message: res.$t('...translation.key...')
};
```

---

## 10. Relationship to Backend

### 10.1 Course Create/Edit → Backend Flow

```
Browser Form Submit
    │
    ▼
Express Controller (this client)
    ├─ Transform form data (times, dates, arrays)
    ├─ POST/PATCH /courses/ (Feathers API)
    │       │
    │       ▼
    │   Feathers Hooks:
    │       ├─ splitClassIdsInGroupsAndClasses
    │       ├─ addWholeClassToCourse (denormalizes students)
    │       ├─ restrictChangesToSyncedCourse
    │       └─ restrictChangesToArchivedCourse
    │
    ├─ Create/Update calendar events
    └─ Redirect to course view
```

### 10.2 Lesson Create/Edit → Backend Flow

```
React Editor → HTML Form Submit
    │
    ▼
Express Controller (this client)
    ├─ Create Etherpads (if new Etherpad blocks)
    ├─ Validate internal component URLs
    ├─ POST/PATCH /lessons/ (Feathers API)
    │       │
    │       ▼
    │   Feathers Hooks:
    │       ├─ restrictToUsersCoursesLessons
    │       ├─ setPosition (on create)
    │       ├─ addShareTokenIfCourseShareable
    │       └─ mapUsers (sets current user on components)
    │
    └─ Redirect to lesson edit page
```

---

## 11. Key Files Quick Reference

| Purpose | File |
|---|---|
| **Controllers** | |
| Course CRUD | [`controllers/courses.js`](../../controllers/courses.js) |
| Lesson/Topic CRUD | [`controllers/topics.js`](../../controllers/topics.js) |
| CourseGroup CRUD | [`controllers/coursegroups.js`](../../controllers/coursegroups.js) |
| Class admin (within admin) | [`controllers/administration.js`](../../controllers/administration.js) (~lines 1020–1480) |
| Route mounting | [`controllers/index.js`](../../controllers/index.js) |
| **Views** | |
| Course detail (groups tab) | [`views/courses/course.hbs`](../../views/courses/course.hbs) |
| Course create form | [`views/courses/create-course.hbs`](../../views/courses/create-course.hbs) |
| Course edit form | [`views/courses/edit-course.hbs`](../../views/courses/edit-course.hbs) |
| Lesson view | [`views/topic/topic.hbs`](../../views/topic/topic.hbs) |
| Lesson editor | [`views/topic/edit-topic.hbs`](../../views/topic/edit-topic.hbs) |
| Lesson content components | [`views/topic/components/`](../../views/topic/components/) (`content-*.hbs`) |
| CourseGroup detail | [`views/courses/courseGroup.hbs`](../../views/courses/courseGroup.hbs) |
| CourseGroup edit | [`views/courses/edit-courseGroup.hbs`](../../views/courses/edit-courseGroup.hbs) |
| Class create/edit form | [`views/administration/classes-edit.hbs`](../../views/administration/classes-edit.hbs) |
| Class member management | [`views/administration/classes-manage.hbs`](../../views/administration/classes-manage.hbs) |
| **Client-Side Scripts** | |
| Course page interactions | [`static/scripts/courses.js`](../../static/scripts/courses.js) |
| Topic block editor (React) | [`static/scripts/topicEdit.js`](../../static/scripts/topicEdit.js) |
| Course times form | [`static/scripts/coursesTimes.js`](../../static/scripts/coursesTimes.js) |
| **Helpers** | |
| API proxy | [`helpers/authentication.js`](../../helpers/authentication.js), [`api.js`](../../api.js) |
| Permissions | [`helpers/permissions.js`](../../helpers/permissions.js) |
| Date/time utilities | [`helpers/timesHelper.js`](../../helpers/timesHelper.js) |
| Redirect utilities | [`helpers/redirect.js`](../../helpers/redirect.js) |
| File storage | [`helpers/files-storage.js`](../../helpers/files-storage.js) |

---

## 12. Known Complexities & Gotchas

| Issue | Details |
|---|---|
| **Mixed API versions** | Lesson GET and DELETE use v3 (NestJS), but CREATE and PATCH use v1 (Feathers). |
| **Topic editor is React** | The only React component in this otherwise jQuery/Handlebars application. Uses `react-sortable-hoc` and CKEditor. |
| **Calendar event recreation** | On course edit, ALL events are deleted and recreated rather than diffed. |
| **Self-removal from course** | Special logic to temporarily keep the user as teacher during calendar event recreation, then remove them. |
| **Two delete routes for classes** | `DELETE /classes/:id` and `DELETE /:classId/` both exist in the administration controller. |
| **Course copy is shallow** | The legacy copy (`/courses/:id/copy`) only copies metadata. The Vue client uses the NestJS deep-copy which includes lessons, tasks, and boards. |
| **Synced course form** | When a course is synced, some form fields are rendered read-only and their values are extracted separately via `getSyncedElements()`. |
| **Etherpad pad creation** | New pads are created at save time (not on block add). If the save fails, the pad still exists. |
| **Groups tab redirect** | `GET /courses/:id/` only serves the Groups tab. Topics and Tools tabs redirect to the Vue client. |
| **Course overview redirect** | `GET /courses/` immediately redirects to `/rooms-overview` (Vue client). |
| **`mergeParams: true`** | Topics and CourseGroups routers use merged params to access `:courseId` from the parent route. |
| **Display name virtual** | Class display names ("7a") are computed as a Mongoose virtual (`gradeLevel + name`) and not stored in the database. |

---

## 13. Suggested Exploration Order

For hands-on exploration after this presentation:

1. **Start with routing:** Read [`controllers/index.js`](../../controllers/index.js) to see the URL hierarchy
2. **Follow a course create:** Trace `GET /courses/add/` → `editCourseHandler` → form submission → `POST /courses/` in [`controllers/courses.js`](../../controllers/courses.js)
3. **Understand the topic editor:** Open [`views/topic/edit-topic.hbs`](../../views/topic/edit-topic.hbs) and [`static/scripts/topicEdit.js`](../../static/scripts/topicEdit.js) side by side
4. **Follow a lesson view:** Trace `GET /courses/:courseId/topics/:topicId` in [`controllers/topics.js`](../../controllers/topics.js) through the Etherpad session flow
5. **Explore class management:** Follow `renderClassEdit` in [`controllers/administration.js`](../../controllers/administration.js) for the three modes (create/edit/upgrade)
6. **Check the course detail page:** Read `GET /courses/:courseId/` in [`controllers/courses.js`](../../controllers/courses.js) and see how it only serves the Groups tab
7. **Understand the redirect pattern:** Search for `returnUrl` and `redirectUrl` to see how Vue client ↔ legacy client navigation works

---

*Document prepared for technical handover, July 2025*
