import { Button, Card, Descriptions, Spin, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getJobById } from '../../services/job';
import { JOB_STATUS } from '../../contants';
import IJob from '../../types/job';

function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: job, isLoading, error } = useQuery<IJob>({
    queryKey: ['job', id],
    queryFn: () => getJobById(id!),
    enabled: !!id
  });

  if (isLoading) return <Spin />;
  if (error) return <p>Đã xảy ra lỗi khi tải dữ liệu</p>;
  if (!job) return <p>Không tìm thấy công việc</p>;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if(hours)
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    else
      return `${minutes.toString().padStart(2, "0")}`;

  };

  return (
    <Card
      title="Thông tin chi tiết công việc KTV"
      extra={<Button onClick={() => navigate(-1)}>Quay lại</Button>}
      style={{ maxWidth: 800, margin: '0 auto' }}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Tên công việc">{job.name}</Descriptions.Item>
        <Descriptions.Item label="Thời gian">{formatTime(job.time)}</Descriptions.Item>
        <Descriptions.Item label="Lần đầu">
          <Tag color={job.isFrist ? 'blue' : 'default'}>
            {job.isFrist ? 'Có' : 'Không'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả">
          {job.description || 'Chưa có mô tả'}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={job.status === JOB_STATUS.ACTIVE ? 'green' : 'red'}>
            {job.status === JOB_STATUS.ACTIVE ? 'Hoạt động' : 'Không hoạt động'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

export default JobDetail;

