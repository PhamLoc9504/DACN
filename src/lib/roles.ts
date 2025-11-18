export enum UserRole {
	ADMIN = 'Quản lý kho',
	WAREHOUSE_STAFF = 'Nhân viên kho',
	SALES_STAFF = 'Nhân viên bán hàng',
	ACCOUNTANT = 'Kế toán',
	SHIPPER = 'Nhân viên giao hàng',
	CUSTOMER = 'Khách hàng',
	SUPPLIER = 'Nhà cung cấp',
}

export type MaybeUserRole = UserRole | string | null | undefined;

const ROLE_ALIAS: Record<string, UserRole> = {
	admin: UserRole.ADMIN,
	'quan ly': UserRole.ADMIN,
	'quản lý': UserRole.ADMIN,
	'nhan vien kho': UserRole.WAREHOUSE_STAFF,
	'nhân viên kho': UserRole.WAREHOUSE_STAFF,
	'nhan vien ban hang': UserRole.SALES_STAFF,
	'nhân viên bán hàng': UserRole.SALES_STAFF,
	'ke toan': UserRole.ACCOUNTANT,
	'kế toán': UserRole.ACCOUNTANT,
	'nhan vien giao hang': UserRole.SHIPPER,
	'nhân viên giao hàng': UserRole.SHIPPER,
	'khach hang': UserRole.CUSTOMER,
	'khách hàng': UserRole.CUSTOMER,
	'nha cung cap': UserRole.SUPPLIER,
	'nhà cung cấp': UserRole.SUPPLIER,
};

function normalizeAlias(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '');
}

export const ALL_ROLES: UserRole[] = Object.values(UserRole);
export const STAFF_ROLES: UserRole[] = ALL_ROLES.filter(
	(role) => role !== UserRole.CUSTOMER && role !== UserRole.SUPPLIER
);
export const ASSIGNABLE_ROLES: UserRole[] = STAFF_ROLES;

export function resolveUserRole(value: MaybeUserRole): UserRole | undefined {
	if (!value) return undefined;
	if (typeof value !== 'string') return undefined;
	if (ALL_ROLES.includes(value as UserRole)) return value as UserRole;
	const alias = ROLE_ALIAS[normalizeAlias(value)];
	return alias;
}

export function normalizeUserRole(value: MaybeUserRole, fallback: UserRole = UserRole.WAREHOUSE_STAFF): UserRole {
	return resolveUserRole(value) ?? fallback;
}

export function hasAnyRole(role: MaybeUserRole, allowed: UserRole[]): boolean {
	if (!allowed.length) return false;
	const resolved = resolveUserRole(role);
	return !!resolved && allowed.includes(resolved);
}

export const ROLE_DISPLAY_NAME: Record<UserRole, string> = {
	[UserRole.ADMIN]: 'Quản lý kho',
	[UserRole.WAREHOUSE_STAFF]: 'Nhân viên kho',
	[UserRole.SALES_STAFF]: 'Nhân viên bán hàng',
	[UserRole.ACCOUNTANT]: 'Kế toán',
	[UserRole.SHIPPER]: 'Nhân viên giao hàng',
	[UserRole.CUSTOMER]: 'Khách hàng',
	[UserRole.SUPPLIER]: 'Nhà cung cấp',
};

export const ROLE_BADGE_COLORS: Record<UserRole, string> = {
	[UserRole.ADMIN]: '#e0616d',
	[UserRole.WAREHOUSE_STAFF]: '#b27d4f',
	[UserRole.SALES_STAFF]: '#e89f3c',
	[UserRole.ACCOUNTANT]: '#4d9f88',
	[UserRole.SHIPPER]: '#50a0e0',
	[UserRole.CUSTOMER]: '#c16ed4',
	[UserRole.SUPPLIER]: '#7c5dcb',
};

export function getRoleDisplayName(role: MaybeUserRole): string {
	const resolved = resolveUserRole(role);
	return resolved ? ROLE_DISPLAY_NAME[resolved] : 'Không xác định';
}

export function getRoleBadgeColor(role: MaybeUserRole): string {
	const resolved = resolveUserRole(role);
	return resolved ? ROLE_BADGE_COLORS[resolved] : '#b8956f';
}

export const FEATURE_KEYS = [
	'dashboard',
	'inventory',
	'import',
	'export',
	'invoice',
	'online-order',
	'order-tracking',
	'payment',
	'shipping',
	'customer-management',
	'purchase-history',
	'supplier-management',
	'staff-management',
	'reports',
	'audit-log',
	'account-management',
	'system-monitor',
	'backup',
	'system-settings',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export type PermissionLevel = 'none' | 'view' | 'self' | 'edit' | 'manage';

function createPermissionProfile(defaultLevel: PermissionLevel): Record<FeatureKey, PermissionLevel> {
	return FEATURE_KEYS.reduce(
		(acc, feature) => {
			acc[feature] = defaultLevel;
			return acc;
		},
		{} as Record<FeatureKey, PermissionLevel>
	);
}

export const ROLE_PERMISSIONS: Record<UserRole, Record<FeatureKey, PermissionLevel>> = {
	[UserRole.ADMIN]: createPermissionProfile('manage'),
	[UserRole.WAREHOUSE_STAFF]: {
		...createPermissionProfile('none'),
		inventory: 'manage',
		import: 'manage',
		export: 'manage',
		'supplier-management': 'view',
		reports: 'view',
	},
	[UserRole.SALES_STAFF]: {
		...createPermissionProfile('none'),
		inventory: 'view',
		export: 'manage',
		invoice: 'manage',
		'online-order': 'manage',
		'order-tracking': 'manage',
		payment: 'manage',
		shipping: 'manage',
		'customer-management': 'manage',
		'purchase-history': 'manage',
		reports: 'view',
	},
	[UserRole.ACCOUNTANT]: {
		...createPermissionProfile('none'),
		dashboard: 'manage',
		inventory: 'view',
		import: 'view',
		export: 'view',
		invoice: 'manage',
		payment: 'manage',
		'purchase-history': 'manage',
		'supplier-management': 'view',
		reports: 'manage',
	},
	[UserRole.SHIPPER]: {
		...createPermissionProfile('none'),
		export: 'view',
		'order-tracking': 'manage',
		shipping: 'manage',
	},
	[UserRole.CUSTOMER]: createPermissionProfile('none'),
	[UserRole.SUPPLIER]: createPermissionProfile('none'),
};

const PERMISSION_WEIGHTS: Record<Exclude<PermissionLevel, 'self'>, number> = {
	none: 0,
	view: 1,
	edit: 2,
	manage: 3,
};

function normalizeLevel(level: PermissionLevel): Exclude<PermissionLevel, 'self'> {
	if (level === 'self') return 'view';
	return level;
}

export function getPermissionLevel(role: MaybeUserRole, feature: FeatureKey): PermissionLevel {
	const resolved = resolveUserRole(role);
	if (!resolved) return 'none';
	return ROLE_PERMISSIONS[resolved]?.[feature] ?? 'none';
}

export function canAccessFeature(role: MaybeUserRole, feature: FeatureKey, required: PermissionLevel = 'view'): boolean {
	const granted = normalizeLevel(getPermissionLevel(role, feature));
	const needed = normalizeLevel(required);
	return PERMISSION_WEIGHTS[granted] >= PERMISSION_WEIGHTS[needed];
}


