import { SEAT_STATUS, SERVICE_TYPE, USER_ROLE } from "../contants";

export const convertNameRoleArray = () => {
  const arrayRole: string[] = Object.values(USER_ROLE);
  if(arrayRole && arrayRole.length){
    const result = arrayRole.map((item:string)=>{
      return {
        value: item,
        name : convertNameRole(item)
      }
    })
    return result;
  }
  return []
}

export const convertNameRole = (role: string) =>{
  switch (role) {
    // case USER_ROLE.CUSTOMER:
    //   return "Khách hàng"
    // case USER_ROLE.ADMIN:
    //   return "Quản trị viên"
    case USER_ROLE.DOCTOR:
      return "Bác sỹ"
    case USER_ROLE.RECEPTIONIST:
      return "Lễ tân"
    case USER_ROLE.STAFF:
      return "Kỹ thuật viên"
    default:
      return "Không xác định"
  }
}

export const getStatusText = (status: SEAT_STATUS) => {
  switch (status) {
    case SEAT_STATUS.AVAILABLE:
      return "Sẵn sàng";
    case SEAT_STATUS.USING:
      return "Đang sử dụng";
    case SEAT_STATUS.REPAIR:
      return "Đang sửa chữa";
    case SEAT_STATUS.DISABLED:
      return "Vô hiệu";
    default:
      return "Không xác định";
  }
};

export const getStatusColor = (status: SEAT_STATUS) => {
  switch (status) {
    case SEAT_STATUS.AVAILABLE:
      return "green";
    case SEAT_STATUS.USING:
      return "blue";
    case SEAT_STATUS.REPAIR:
      return "orange";
    case SEAT_STATUS.DISABLED:
      return "red";
    default:
      return "default";
  }
};

export const getStatusBgColor = (status: SEAT_STATUS) => {
  switch (status) {
    case SEAT_STATUS.AVAILABLE:
      return "#f6ffed";
    case SEAT_STATUS.USING:
      return "#e6f7ff";
    case SEAT_STATUS.REPAIR:
      return "#fff7e6";
    case SEAT_STATUS.DISABLED:
      return "#fff1f0";
    default:
      return "#fafafa";
  }
};

export const getStatusBorderColor = (status: SEAT_STATUS) => {
  switch (status) {
    case SEAT_STATUS.AVAILABLE:
      return "#b7eb8f";
    case SEAT_STATUS.USING:
      return "#91d5ff";
    case SEAT_STATUS.REPAIR:
      return "#ffd591";
    case SEAT_STATUS.DISABLED:
      return "#ffccc7";
    default:
      return "#d9d9d9";
  }
};

export const getServiceType = (type: string) => {
  switch (type) {
    case SERVICE_TYPE.JOB:
      return "Công việc KTV";
    case SERVICE_TYPE.TRICK:
      return "Thủ thuật";
    default:
      return "Không xác định"
  }
};