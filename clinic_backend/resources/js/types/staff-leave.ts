export interface LeaveClinic {
    id: number;
    name_en: string;
    name_ar: string | null;
    staff?: { id: number; name: string }[];
}

export interface StaffLeave {
    id: number;
    clinic_id: number;
    staff_id: number;
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    clinic: LeaveClinic | null;
    staff: { id: number; name: string } | null;
}
