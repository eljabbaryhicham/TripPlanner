'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/personalized-service-suggestions.ts';
import '@/ai/flows/manage-admin-flow.ts';
