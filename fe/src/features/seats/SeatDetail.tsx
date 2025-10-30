import { Button, Card, Descriptions, Spin, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSeatById } from '../../services/seat';
import { SEAT_STATUS } from '../../contants';
import ISeat from '../../types/seat';

function SeatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: seat, isLoading, error } = useQuery<ISeat>({
    queryKey: ['seat', id],
    queryFn: () => getSeatById(id!),
    enabled: !!id
  });

  if (isLoading) return <Spin />;
  if (error) return <p>Đã xảy ra lỗi khi tải dữ liệu</p>;
  if (!seat) return <p>Không tìm thấy ghế</p>;

  const getStatusText = (status: SEAT_STATUS) => {
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

  const getStatusColor = (status: SEAT_STATUS) => {
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

  const location = typeof seat.locationId === 'object' && seat.locationId 
    ? seat.locationId.name 
    : '-';

  return (
    <Card
      title="Thông tin chi tiết ghế"
      extra={<Button onClick={() => navigate(-1)}>Quay lại</Button>}
      style={{ maxWidth: 800, margin: '0 auto' }}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Tên ghế">{seat.name}</Descriptions.Item>
        <Descriptions.Item label="Vị trí">{location}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={getStatusColor(seat.status)}>
            {getStatusText(seat.status)}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả">
          {seat.description || 'Chưa có mô tả'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

export default SeatDetail;

