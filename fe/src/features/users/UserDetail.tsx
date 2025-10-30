import { Button, Card, Descriptions, Spin, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUserById } from '../../services/user'; // API lấy 1 user
import { USER_STATUS } from '../../contants';
import { convertNameRole } from '../../utils/helper';

function UserDetail() {
  const { id } = useParams(); // Lấy ID từ URL
  const navigate = useNavigate();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUserById(id!),
    enabled: !!id
  });

  if (isLoading) return <Spin />;
  if (error) return <p>Đã xảy ra lỗi khi tải dữ liệu</p>;
  if (!user) return <p>Không tìm thấy tài khoản</p>;

  return (
    <Card
      title="Thông tin chi tiết tài khoản"
      extra={<Button onClick={() => navigate(-1)}>Quay lại</Button>}
      style={{ maxWidth: 800, margin: '0 auto' }}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Họ tên">{user.name}</Descriptions.Item>
        <Descriptions.Item label="Tên đăng nhập">{user.username}</Descriptions.Item>
        <Descriptions.Item label="Email">{user.staffId?.email || 'Chưa có email'}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">{user.staffId?.phone || 'Chưa có số'}</Descriptions.Item>
        <Descriptions.Item label="Thuộc nhân viên">{user.staffId?.name || 'Chưa liên kết'}</Descriptions.Item>
        <Descriptions.Item label="Vai trò">{convertNameRole(user.role)}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={user.status === USER_STATUS.ACTIVE ? 'green' : 'red'}>
            {user.status === USER_STATUS.ACTIVE ? 'Hoạt động' : 'Ngừng'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

export default UserDetail;
