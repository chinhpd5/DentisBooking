import { Col, Form, Row, TimePicker, Space, Typography } from "antd";
import dayjs, { Dayjs } from "dayjs";

interface ScheduleInputProps {
  formName: string;
  label: string;
}

const { Text } = Typography;

const ScheduleInput: React.FC<ScheduleInputProps> = ({ formName, label }) => {
  const convertTimeToMinutes = (time: Dayjs | null): number => {
    if (!time) return 0;
    return time.hour() * 60 + time.minute();
  };

  const convertMinutesToTime = (minutes: number | undefined): Dayjs | null => {
    if (!minutes || minutes === 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return dayjs().hour(hours).minute(mins).second(0).millisecond(0);
  };

  // Disable hours outside of morning shift (0h - 11h)
  const disabledMorningHours = () => {
    const hours: number[] = [];
    for (let i = 12; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  // Disable hours outside of afternoon shift (12h - 23h)
  const disabledAfternoonHours = () => {
    const hours: number[] = [];
    for (let i = 0; i < 12; i++) {
      hours.push(i);
    }
    return hours;
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ marginBottom: 16, fontWeight: "bold" }}>{label}</h2>
      <Row gutter={16}>
        {/* Buổi sáng */}
        <Col span={12}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Buổi sáng</Text>
          </div>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text>Giờ bắt đầu:</Text>
              <Form.Item
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues?.[formName]?.morning?.end !== currentValues?.[formName]?.morning?.end
                }
                noStyle
              >
                {({ getFieldValue }) => (
                  <Form.Item
                    name={[formName, "morning", "start"]}
                    noStyle
                    getValueProps={(value?: number) => ({
                      value: convertMinutesToTime(value),
                    })}
                    normalize={(value) => convertTimeToMinutes(value)}
                    rules={[
                      {
                        validator: (_, value) => {
                          const end = getFieldValue([formName, "morning", "end"]);
                          if (end && (!value || value === 0)) {
                            return Promise.reject(new Error("Vui lòng chọn giờ bắt đầu buổi sáng"));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <TimePicker
                      format="HH:mm"
                      style={{ width: "100%", marginTop: 4 }}
                      placeholder="Chọn giờ bắt đầu"
                      disabledHours={() => disabledMorningHours()}
                    />
                  </Form.Item>
                )}
              </Form.Item>
            </div>
            <div>
              <Text>Giờ kết thúc:</Text>
              <Form.Item
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues?.[formName]?.morning?.start !== currentValues?.[formName]?.morning?.start
                }
                noStyle
              >
                {({ getFieldValue }) => (
                  <Form.Item
                    name={[formName, "morning", "end"]}
                    noStyle
                    getValueProps={(value?: number) => ({
                      value: convertMinutesToTime(value),
                    })}
                    normalize={(value) => convertTimeToMinutes(value)}
                    rules={[
                      {
                        validator: (_, value) => {
                          const start = getFieldValue([formName, "morning", "start"]);
                          if (start && (!value || value === 0)) {
                            return Promise.reject(new Error("Vui lòng chọn giờ kết thúc buổi sáng"));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <TimePicker
                      format="HH:mm"
                      style={{ width: "100%", marginTop: 4 }}
                      placeholder="Chọn giờ kết thúc"
                    />
                  </Form.Item>
                )}
              </Form.Item>
            </div>
          </Space>
        </Col>

        {/* Buổi chiều tối */}
        <Col span={12}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Buổi chiều tối</Text>
          </div>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text>Giờ bắt đầu:</Text>
              <Form.Item
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues?.[formName]?.afternoon?.end !== currentValues?.[formName]?.afternoon?.end
                }
                noStyle
              >
                {({ getFieldValue }) => (
                  <Form.Item
                    name={[formName, "afternoon", "start"]}
                    noStyle
                    getValueProps={(value?: number) => ({
                      value: convertMinutesToTime(value),
                    })}
                    normalize={(value) => convertTimeToMinutes(value)}
                    rules={[
                      {
                        validator: (_, value) => {
                          const end = getFieldValue([formName, "afternoon", "end"]);
                          if (end && (!value || value === 0)) {
                            return Promise.reject(new Error("Vui lòng chọn giờ bắt đầu buổi chiều tối"));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <TimePicker
                      format="HH:mm"
                      style={{ width: "100%", marginTop: 4 }}
                      placeholder="Chọn giờ bắt đầu"
                      disabledHours={() => disabledAfternoonHours()}
                    />
                  </Form.Item>
                )}
              </Form.Item>
            </div>
            <div>
              <Text>Giờ kết thúc:</Text>
              <Form.Item
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues?.[formName]?.afternoon?.start !== currentValues?.[formName]?.afternoon?.start
                }
                noStyle
              >
                {({ getFieldValue }) => (
                  <Form.Item
                    name={[formName, "afternoon", "end"]}
                    noStyle
                    getValueProps={(value?: number) => ({
                      value: convertMinutesToTime(value),
                    })}
                    normalize={(value) => convertTimeToMinutes(value)}
                    rules={[
                      {
                        validator: (_, value) => {
                          const start = getFieldValue([formName, "afternoon", "start"]);
                          if (start && (!value || value === 0)) {
                            return Promise.reject(new Error("Vui lòng chọn giờ kết thúc buổi chiều tối"));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <TimePicker
                      format="HH:mm"
                      style={{ width: "100%", marginTop: 4 }}
                      placeholder="Chọn giờ kết thúc"
                    />
                  </Form.Item>
                )}
              </Form.Item>
            </div>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default ScheduleInput;
