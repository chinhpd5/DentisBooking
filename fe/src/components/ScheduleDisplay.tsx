import { Table } from "antd";
import { IStaff } from "../types/staff";

interface ScheduleDisplayProps {
  staff: IStaff;
}

interface ScheduleRow {
  key: string;
  dayName: string;
  schedule?: IStaff['scheduleMonday'];
}

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ staff }) => {
  const convertMinutesToTime = (minutes: number | undefined): string => {
    if (!minutes || minutes === 0) return "Nghỉ";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getDayName = (dayKey: string): string => {
    const dayNames: { [key: string]: string } = {
      scheduleMonday: "Thứ 2",
      scheduleTuesday: "Thứ 3",
      scheduleWednesday: "Thứ 4",
      scheduleThursday: "Thứ 5",
      scheduleFriday: "Thứ 6",
      scheduleSaturday: "Thứ 7",
      scheduleSunday: "Chủ Nhật",
    };
    return dayNames[dayKey] || dayKey;
  };

  const scheduleData = [
    { day: "scheduleMonday", schedule: staff.scheduleMonday },
    { day: "scheduleTuesday", schedule: staff.scheduleTuesday },
    { day: "scheduleWednesday", schedule: staff.scheduleWednesday },
    { day: "scheduleThursday", schedule: staff.scheduleThursday },
    { day: "scheduleFriday", schedule: staff.scheduleFriday },
    { day: "scheduleSaturday", schedule: staff.scheduleSaturday },
    { day: "scheduleSunday", schedule: staff.scheduleSunday },
  ];

  const columns = [
    {
      title: "Ngày",
      dataIndex: "dayName",
      key: "dayName",
      width: 100,
    },
    {
      title: "Buổi sáng",
      key: "morning",
      render: (_: unknown, record: ScheduleRow) => {
        const morning = record.schedule?.morning;
        if (!morning || !morning.start || !morning.end) return "Nghỉ";
        return `${convertMinutesToTime(morning.start)} - ${convertMinutesToTime(morning.end)}`;
      },
    },
    {
      title: "Buổi chiều tối",
      key: "afternoon",
      render: (_: unknown, record: ScheduleRow) => {
        const afternoon = record.schedule?.afternoon;
        if (!afternoon || !afternoon.start || !afternoon.end) return "Nghỉ";
        return `${convertMinutesToTime(afternoon.start)} - ${convertMinutesToTime(afternoon.end)}`;
      },
    },
  ];

  const dataSource: ScheduleRow[] = scheduleData.map((item) => ({
    key: item.day,
    dayName: getDayName(item.day),
    schedule: item.schedule,
  }));

  return (
    <div style={{ marginTop: 24 }}>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        bordered
        size="small"
      />
    </div>
  );
};

export default ScheduleDisplay;

