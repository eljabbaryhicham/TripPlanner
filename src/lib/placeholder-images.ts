import data from './placeholder-images.json';
import type { Service } from './types';

// The source JSON contains the full service objects now.
// The name of this file is misleading, but we cannot rename it.
export const services: Service[] = (data as any).services || [];
