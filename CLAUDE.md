# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- `npm run dev` - Start the development server (localhost:8080)
- `npm run build` - Build production version
- `npm run build:dev` - Build development version
- `npm run lint` - Run ESLint
- `npm run preview` - Preview built application

## Project Architecture

This is a React TypeScript application built with Vite, using shadcn/ui components and Tailwind CSS. The application is a creative management system for ad campaigns with multi-step form workflow.

### Key Architecture Components

**Multi-Step Form System**: The core functionality is a 4-step creative submission process managed by `CreativeSystem.tsx`:
1. Step 1: Basic info (client, platform, objectives)
2. Step 2: File uploads (single media, carousel, existing posts)
3. Step 3: Content creation (titles, descriptions, CTAs)
4. Step 4: Review and submission

**State Management**: Uses React Context for authentication (`AuthContext`) and theming (`ThemeContext`), with custom hooks for form management:
- `useCreativeForm` - Form state and validation
- `useCreativeSubmission` - Submission handling
- `useNotionData` - Data fetching from Notion API

**Backend Integration**: 
- Supabase for database and authentication
- Notion API integration via Supabase Edge Functions (`supabase/functions/`)
- Creative submission process connects to Notion for client/partner data

**File Handling**: Sophisticated file validation and preview system:
- `utils/fileValidation.ts` - File format and size validation
- `utils/mediaAnalysis.ts` - Media dimension analysis
- `utils/thumbnailUtils.ts` - Thumbnail generation and caching
- Support for images, videos, and Instagram URL parsing

**UI Components**:
- Custom Jumper-branded components (`ui/jumper-*`)
- shadcn/ui base components
- Responsive design with Tailwind CSS

### Key Data Structures

**FormData interface** (`types/creative.ts`): Central data structure containing all form fields across steps, including support for carousel ads, media variations, and existing post integration.

**Platform-specific specifications**: META_SPECS defines image/video requirements for Meta Ads, including carousel aspect ratios and safe zones.

### Authentication Flow

Simple localStorage-based authentication with Manager type users. Protected routes use `ProtectedRoute` component. Login page allows manager selection from Notion data.

### Development Notes

- Uses Vite with React SWC plugin for fast development
- ESLint configured with React-specific rules
- TypeScript with strict configuration
- Lovable platform integration for deployment
- Custom theme system with dark/light mode support