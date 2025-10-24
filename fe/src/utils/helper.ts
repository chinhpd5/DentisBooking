import { USER_ROLE } from "../contants";

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
    case USER_ROLE.CUSTOMER:
      return "Khách hàng"
    case USER_ROLE.ADMIN:
      return "Quản trị viên"
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

