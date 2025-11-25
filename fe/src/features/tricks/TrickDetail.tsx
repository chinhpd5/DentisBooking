import { Button, Card, Descriptions, Spin, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTrickById } from '../../services/trick';
import { TRICK_STATUS } from '../../contants';
import ITrick from '../../types/trick';
import { IStaff } from '../../types/staff';
import { convertNameRole } from '../../utils/helper';

function TrickDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: trick, isLoading, error } = useQuery<ITrick>({
    queryKey: ['trick', id],
    queryFn: () => getTrickById(id!),
    enabled: !!id
  });

  if (isLoading) return <Spin />;
  if (error) return <p>Đã xảy ra lỗi khi tải dữ liệu</p>;
  if (!trick) return <p>Không tìm thấy thủ thuật</p>;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if(hours)
      return `${hours.toString().padStart(2, "0")} giờ : ${minutes.toString().padStart(2, "0")} phút `;
    else
      return `${minutes.toString().padStart(2, "0")} phút`;
  };

  const staff = typeof trick.staffIds === 'object' ? trick.staffIds : null;
  
  const jobs = Array.isArray(trick.jobIds) ? trick.jobIds : [];

  // Tính tổng thời gian = thời gian trick + tổng thời gian các job
  const totalTime = trick.time + jobs.reduce((sum, job) => {
    if (typeof job === 'object' && job.time) {
      return sum + job.time;
    }
    return sum;
  }, 0);

  const formatTimeDisplay = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    if(hours)
      return `${hours.toString().padStart(2, "0")} giờ : ${minutes.toString().padStart(2, "0")} phút`;
    else
      return `${minutes.toString().padStart(2, "0")} phút`;
  };

  return (
    <Card
      title="Thông tin chi tiết thủ thuật"
      extra={<Button onClick={() => navigate(-1)}>Quay lại</Button>}
      style={{ maxWidth: 800, margin: '0 auto' }}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Tên thủ thuật">{trick.name}</Descriptions.Item>
        <Descriptions.Item label="Thời gian">{formatTime(trick.time)}</Descriptions.Item>
        <Descriptions.Item label="Nhân viên">
          {staff ? staff.map((staff: IStaff) => `${staff.name} - ${convertNameRole(staff.role)}`).join(", ") : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Số lượng nhân viên">{trick.countStaff}</Descriptions.Item>
        <Descriptions.Item label="Danh sách công việc">
          {jobs.length > 0 
            ? jobs.map((job, index) => (
                typeof job === 'object' 
                  ? <Tag key={job._id || index} style={{ marginBottom: 4 }}>{job.name} - {formatTimeDisplay(job.time)}</Tag>
                  : null
              ))
            : 'Chưa có công việc'
          }
        </Descriptions.Item>
        <Descriptions.Item label="Tổng thời gian">
          {formatTimeDisplay(totalTime)}
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả">
          {trick.description || 'Chưa có mô tả'}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={trick.status === TRICK_STATUS.ACTIVE ? 'green' : 'red'}>
            {trick.status === TRICK_STATUS.ACTIVE ? 'Hoạt động' : 'Không hoạt động'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

export default TrickDetail;

