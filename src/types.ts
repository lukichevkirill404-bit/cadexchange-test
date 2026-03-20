export type ReserveRequest = {
  user_id: string;
  seat_id: string;
};

export type ReserveSuccessResponse = {
  status: "success";
  user_id: string;
  seat_id: string;
};

export type ReserveAlreadyReservedResponse = {
  status: "already_reserved";
  user_id: string;
  seat_id: string;
  user_id_existing: string;
};

export type ReserveResponse = ReserveSuccessResponse | ReserveAlreadyReservedResponse;

