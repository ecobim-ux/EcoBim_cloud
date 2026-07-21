/** The client-approval workflow's full state machine, extracted from the
    transition route so the permission matrix — who may do what — is a plain
    data structure that can be unit tested without a database. */
export interface ApprovalActionRule {
  toStageCode: string | null;
  roles: string[];
  terminal?: boolean;
}

export const APPROVAL_ACTION_RULES: Record<string, ApprovalActionRule> = {
  SUGGEST_UPDATES: { toStageCode: "CHANGES_REQUESTED", roles: ["admin"] },
  SEND_TO_CLIENT: { toStageCode: "SENT_TO_CLIENT", roles: ["admin"] },
  APPROVE: { toStageCode: "APPROVED", roles: ["admin", "client"], terminal: true },
  REQUEST_REVISION: { toStageCode: "CHANGES_REQUESTED", roles: ["client"] },
  REMIND: { toStageCode: null, roles: ["admin"] },
};

export function canPerformApprovalAction(role: string, action: string): boolean {
  const rule = APPROVAL_ACTION_RULES[action];
  return rule ? rule.roles.includes(role) : false;
}
