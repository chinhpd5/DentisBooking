import { Button, Card, Descriptions, Spin, Tag } from 'antd'
import { STAFF_STATUS } from '../../contants'
import { convertNameRole } from '../../utils/helper'
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStaffById } from '../../services/staff';

function StaffDetail() {

  const { id } = useParams();
  const navigate = useNavigate();

  const { data : staff, isLoading, error } = useQuery({
    queryKey: ["staff", id],
    queryFn: () => getStaffById(id as string),
    enabled: !!id,
  });

  if (isLoading) return <Spin />;
  if (error) return <p>Lỗi khi tải dữ liệu</p>;
  if (!staff) return <p>Không tìm thấy nhân viên</p>;

  return (
    <Card
      title="Thông tin chi tiết nhân viên"
      extra={<Button onClick={() => navigate(-1)}>Quay lại</Button>}
      style={{ maxWidth: 800, margin: "0 auto" }}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Họ và tên">{staff.name}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">{staff.phone}</Descriptions.Item>
        <Descriptions.Item label="Email">{staff.email || "Chưa cập nhật"}</Descriptions.Item>
        <Descriptions.Item label="Vai trò">{convertNameRole(staff.role)}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={staff.status === STAFF_STATUS.ACTIVE ? "green" : "red"}>
            {staff.status === STAFF_STATUS.ACTIVE ? "Đang làm" : "Đã nghỉ"}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}

export default StaffDetail