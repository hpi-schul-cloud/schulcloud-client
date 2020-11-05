# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Allowed Types of change: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

## Unreleased
###Added

- SC-6662 - Add data-testid in homework for integration test

### Added

- SC-7447 - Add warning text for links when leaving the schul-cloud platform
- SC-6293 - added option to school admin to disable lernstore for students
- SC-7413 - Add winston handler for logging unhandled rejection and exceptions
- SC-5942 - Add trim() before email for password recovery got send to server
- OPS-1297 - Added Changelog github action

### Fixed

- SC-7652 - Fixed teacher creates a calendar in team then Dashboard empty
- SC-7645 - Fixed team calendar timezone bug
- SC-7666 - Fixed rss translation key
- SC-5555 - Fixed class names not being visible in course creation in some cases
- SC-7463 - Fixed undefined value when requesting school systems login
- SC-7392 fix create event for teams / courses
- SC-6931 fixed link names in Niedersachsen, Open and Thueringen to privacy and termsOfUse on homepage
- SC-6721 - fixed classes list in course administration
- SC-7084 - changed file permission name Mitglied to Teilnehmer
- SC-5501 - fixed grammar issue for password recovery request

### Changed

- SC-7530 rename SHOW_VERSION to FEATURE_SHOW_VERSION_ENABLED
- update commons to 1.3.0 to enable printing current config on startup, fix default.json to be valid by adding cookie defaults
- SC-6951 removes via text from embeded course content
- SC-6870 use don't show again checkbox value even if the admin goes to the settings page
- IMP-160 rename integration test repository

## 25.2.0

### Fixed

- SC-5825 Fix progress display in homeworks
- SC-7590 Fixied missing permission for enabling consent by teachers
- SC-7151 Fixing sentence structure while registration for parents
- SC-7350 Fix invalid date
- SC-7182 do not allow to open office files in new windows

- SC-6060 Cookie configuration
- SC-4209 Choose the same move icon for course topics and topic editor

### Added

- SC-6870 - Added UX improvements for Matrix messenger announcement
- SC-7083 - Added input to get the school id from admin

## [25.1.7] - 2020-10-27

### Fixed

- SC-7502 - Fixed disabled attribute definition on registration link buttons

## [25.1.6] - 2020-10-21

### Added

- SC-7447 - Add warning text for links when leaving the schul-cloud platform

## [25.1.5] - 2020-10-27

### Fixed

- SC-7490 fixed get request for landing pages which are not from ghost

## [25.1.4] - 2020-10-26

### Fixed

- SC-6735 additional fix - administration remove consent triggers import hash generation

## [25.1.3] - 2020-10-21

### Fixed

- SC-6735 administration remove consent triggers import hash generation

## [25.1.2] - 2020-10-20

### Fixed

- SC-7437 fixed display of user name on qr codes

## [25.1.1] - 2020-10-15

### Fixed

- SC-7085 fixed importHash error when asking parent consent

## [25.0.7] - 2020-10-09

### Fixed

- SC-7171 fix asking for confirmation after consent update

### Added

 - SC-6582 Add bidirectional messenger settings for course creation

## [25.0.6] - 2020-10-01

### Added

- SC-6973 add importHash to registrationPins post request

## [25.0.5] - 2020-09-30

### Fixed

- SC-6945 Add requirement for etherpad section title to fix null matching error

## [25.0.4] - 2020-09-30

### Changed

- SC-6567 clear and improve logging in error case
- SC-5858 removed chosen library from the code (Accessibility issues)

## [25.0.3] - 2020-09-29

### Fixed

- SC-6940 hanndle undefined in language detection

## [25.0.2] - 2020-09-29

### Fixed

  - SC-6927 Admins can delete teachers again

## [25.0.1] - 2020-09-28


### Fixed

  - SC-6932 added translation keys instead of hardcoded strings for sidebar items

## [24.5.7] - 2020-09-22

### Fixed

  - SC-6845 Fixed reset of consent property if inputs disabled

## [24.5.6] - 2020-09-22

### Fixed

  - SC-6823 - Fixed inserting media in comments for homework correction

## [24.5.5] - 2020-09-22

### Fixed

  - SC-6630 Fixed email validation using an undefined value when inviting experts to a team.

## [24.5.4] - 2020-09-21

### Fixed

  - SC-6762 Fix file upload permissions for evaluation

## [24.5.3] - 2020-09-18

### Fixed

  - SC-6761 Fixed messenger activation in courses

## [24.5.2] - 2020-09-16

### Fixed

  - SC-6637 Updated CSS of QR codes to avoid broken print layout

## [24.5.1] - 2020-09-14

### Fixed

  - SC-6761 Fixed individual registration emails

## [24.4.2] - 2020-09-09

### Fixed
- SC-6533 - Login not possible if admin reset password

  - SC-5707 Added detection of browser language
  - SC-5706 Added language selection within teacher registration
  - SC-6019 Added tabbar to classes administration
  - SC-5955 Changed links to Lernen.cloud
  - SC-5644 navigation and the general structure of pages made more accessible (a11y)
  - SC-6245 If students can create teams, they can also invite other students to teams

## [24.4.1] - 2020-9-01

  - SC-6526 Fixed inserting files in CKEditor for topics

## [24.4.0] - 2020-8-31

  - SC-6019 Added tabbar to classes administration
  - SC-5955 Changed links to Lernen.cloud
  - SC-5644 navigation and the general structure of pages made more accessible (a11y)

## [24.3.2] - 2020-08-26

- SC-6382 fix first login shown on every login in tsp

## [24.3.1] - 2020-08-26

- SC-6382 fix default  wellcome text for tsp 

## [24.3.0] - 2020-08-25
### Changed - 24.3.0

  - SC-5644 navigation and the general structure of pages made more accessible (a11y)

## [24.2.5] - 2020-08-20
### Fixed - 24.2.5

  - SC-6296 Only show edit and delete button for eligible systems

## [24.2.4] - 2020-08-20

## [24.2.3] - 2020-08-18
### Changed - 24.2.3

  - SC-6239 Changed default email domains in many different places from @schul-cloud.org to @hpi-schul-cloud.de
  - SC-6239 Changed links to blog to blog.hpi-schul-cloud.de

## [24.2.1] - 2020-08-13
## Fixed - 24.2.1

  - SC-6012 Etherpad authorization error due to unique name problem
  - SC-6125 fix broken link

## [24.0.3] - 2020-08-05
### Fixed - 24.0.3

  - SC-5948 Fix login for international cloud

## [24.0.2] - 2020-08-05
### Fixed - 24.0.2
   SC-5954 Fix messenger settings in teams

## [24.0.1] - 2020-07-31
### Fixed - 24.0.1
   SC-5917 Fix activation of LDAP system

## [24.0.0] - 2020-07-30

### Added - 24.0.0
- SC-4151 hint for user when login failes
- SC-4577 school specific privacy policy can be added by the school admin. If school specific privacy policy is exists 
it is shown to every school user by the registration, first login and in the footer of the page. If it was changed the
privacy policy should be confirmed by every school user


### Fixed - 24.0.0
-  SC-4993 fixed video player issue in ckeditor
-  SC-5686 :teamId/edit can only be accessed if the user has the team permission "RENAME_TEAM"; :courseId/edit can only 
be accessed if the user has the permission "COURSE_EDIT

### Changed - 24.0.0

- SC-5327 removed 'bereich' suffix from navigation items

### Removed - 23.6.0

## [23.5.7] - 2020-07-17

- SC-5653 update mint-ec email addresses

## [23.5.3] - 2020-07-10

- SC-5494 Changed link in navigation bar
- SC-5529 update hpi school-cloud brand name

## [23.5.2] - 2020-07-09

- SC-5494 Changed link in navigation bar
- SC-5529 update hpi school-cloud brand name

## [23.4.4] - 2020-06-18

- fix mocha tests on server

## [23.4.3] - 2020-06-17

- SC-5048 Temporarily disables Portfolio for NBC by removal of link to portfolio in add-ons.

## [23.1.2] - 2020-06-02

### Changed
- SC-4766 minor text changes for n21

## [23.1.0] - 2020-05-20

### Added

- SC-4250, SC-4135, SC-4252, loading new landing page content and theme from ghost. About page partly loaded from ghost. Login form removed from front page and replaced by button in navbar. Demo-Login removed from front page.

### Fixed

### Changed

### Security
- SC-4506 Secure User Route. Removed not used /users route from view team members. 

### Removed


## [23.0.0] - 2020-05-19

### Changed in 23.0.0

- SC-4392 add/edit link dialog in ckeditor could not be opened
- SC-4075 Teams creation by students logic was changed. New environment enumeration variable `STUDENT_TEAM_CREATION` 
with possible values `disabled`, `enabled`, `opt-in`, `opt-out` was introduced. The feature value is set by instance deployment. 
In case of `disabled`, `enabled` it is valid for all schools of the instance and cannot be changed by the admin. 
In case of `opt-in` and `opt-out` the feature should be enabled/disabled by the school admin.

### Fixed

- SC-4392 add/edit link dialog in ckeditor could not be opened

## [22.10.0] - 2020-05-11

### Security in 22.10.0
- SC-3990 generation of first login passwords

### Added in 22.10.0
- SC-3664 query toast-type and toast-message
- SC-3892 Task sorting on the course side
- SC-3757 the LDAP config page now contains a link to the docs
- SC-438 on logout button click localStorge will be deleted
- SC-3801 added generic filepicker url to ckeditor
- SC-4260 added sentry sampling
- SC-4064 allow to append files to submission feedback
- SC-4064 allow for bulk download of ungraded homework files
- SC-4064 allow for bulk upload of graded homework files

### Changed in 22.10.0

- SC-3607 CSV import now suggests the new birthday field (sample file + image)
- SC-3607 the student/teacher import page now displays a warning for large imports
- updated airbnb linter from 13.1 to 14.1
- SC-3801 updated CKEDITOR to 4.14
- SC-3801 changes CKEDITOR theme to a more maintained one (n1theme)

### Fixed in 22.10.0

- SC-3945 Courses are now again unarchiveable


## [22.9.12] - 2020-05-06

### Changed in 22.9.12

- Moved the Cookie parameters into the configuration
- Cookie property sameSite changed from strict to none as default

## [22.9.8] - 2020-04-23

### Added in 22.9.8

- add support for API-Key

## [22.9.7] - 2020-04-21

### Added in 22.9.7

- part of frontpage now loading content from sc blog.

## [22.9.2] - 2020-04-09

### Changed in 22.9.2

- All team events load now.

## [22.9.1] - 2020-04-08

### Changed in 22.9.1

- SC-3951: frontpage of n21 now loading content from n21 blog

## [22.9.0] - 2020-04-08

### Changed in 22.9.0

- Security fixes, Update Handlebars from 4.5 to 4.7
- SC-3749 remove cookie domain
- use babel-eslint parser for eslint and updated liner rules for json
- SC-3719 Shared files are now determined more more cleverly

## [22.8.0]

### Fixed in 22.8.0

- SC-3732: edit button was not visible for course teachers except the author on the task detail page

## [22.7.2] - 2020-04-03

### Changed in 22.7.2

- SC-3900 update tsc email on community page

## [22.7.1] - 2020-04-02

### Added in 22.7.1

- This changelog has been added

### Changed in 22.7.1

- SC-3884 update community page text
- SC-3872: update dataprivacy text
- SC-3868 changed NBC contact details from `terhaseborg@n-21.de` to `nbc-support@netz-21.de`
- SC-3878 some styling and interaction improvements to homeworks and archived homeworks

### Fixed in 22.7.1

- SC-3785: link to course after course creation corrected
- SC-3732: edit button was not visible for course teachers except the author on the task detail page
- SC-3807: link "Methodenguide" in nbc addons
- provide more formats for PTSans font to be compatible with more browsers
