import './cors-mini';

import {
	AuthService,
	BCParksJob,
	DEVICE_REGISTRATION_SERVICE_NAME,
	HttpJob,
	HydrationReminderJob,
	ICBCMonitorJob,
	ICBCServicesJob,
	IcmMonitorJob,
	KeepAwakeJob,
	PCExpressProductMonitorJob,
	resolveService,
	Scheduler,
	ServiceCanadaMonitorJob,
	ShawMonitorJob,
	TeamsReloadJob,
	USVisaDatesMonitorJob
} from '@mahindar5/common-lib';
import { NodeDeviceRegistrationService } from '@mahindar5/common-lib/node';

const jobs: Array<new (...args: any[]) => any> = [
	KeepAwakeJob,
	TeamsReloadJob,
	HttpJob,
	ShawMonitorJob,
	HydrationReminderJob,
	BCParksJob,
	PCExpressProductMonitorJob,
	IcmMonitorJob,
	ICBCServicesJob,
	ICBCMonitorJob,
	ServiceCanadaMonitorJob,
	USVisaDatesMonitorJob,
	Scheduler
];

resolveService(NodeDeviceRegistrationService, [], DEVICE_REGISTRATION_SERVICE_NAME);

// Register AuthService with explicit name to avoid minification issues
resolveService(AuthService, [], 'AuthService');

jobs.forEach((JobClass: any) => {
	resolveService(JobClass);
	console.log(`✅ Registered: ${JobClass.name}`);
});

console.log('🚀 Jobs initialized');
