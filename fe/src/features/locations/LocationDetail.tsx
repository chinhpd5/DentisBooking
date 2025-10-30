import { Button, Card, Descriptions, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLocationById } from '../../services/location';

function LocationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: location, isLoading, error } = useQuery({
    queryKey: ['location', id],
    queryFn: () => getLocationById(id!),
    enabled: !!id
  });

  if (isLoading) return <Spin />;
  if (error) return <p>Đã xảy ra lỗi khi tải dữ liệu</p>;
  if (!location) return <p>Không tìm thấy tầng</p>;

  return (
    <Card
      title="Thông tin chi tiết tầng"
      extra={<Button onClick={() => navigate(-1)}>Quay lại</Button>}
      style={{ maxWidth: 800, margin: '0 auto' }}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Tên tầng">{location.name}</Descriptions.Item>
        <Descriptions.Item label="Mô tả">
          {location.description || 'Chưa có mô tả'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

export default LocationDetail;

