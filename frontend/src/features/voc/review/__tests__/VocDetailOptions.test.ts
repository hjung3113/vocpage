import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  REVIEW_STATUS_OPTIONS,
  RESOLUTION_QUALITY_OPTIONS,
  DROP_REASON_OPTIONS,
} from '../ui/VocDetailOptions';

describe('VocDetailOptions', () => {
  it('STATUS_OPTIONS has correct shape and values', () => {
    expect(STATUS_OPTIONS).toHaveLength(5);
    expect(STATUS_OPTIONS[0]).toEqual({ id: '접수', label: '접수' });
    expect(STATUS_OPTIONS[4]).toEqual({ id: '드랍', label: '드랍' });
  });

  it('PRIORITY_OPTIONS has 4 entries', () => {
    expect(PRIORITY_OPTIONS).toHaveLength(4);
    expect(PRIORITY_OPTIONS[0]).toEqual({ id: 'urgent', label: '긴급' });
  });

  it('REVIEW_STATUS_OPTIONS has 4 entries', () => {
    expect(REVIEW_STATUS_OPTIONS).toHaveLength(4);
    expect(REVIEW_STATUS_OPTIONS[0]).toEqual({ id: 'unverified', label: '미검토' });
  });

  it('RESOLUTION_QUALITY_OPTIONS has 2 entries', () => {
    expect(RESOLUTION_QUALITY_OPTIONS).toHaveLength(2);
  });

  it('DROP_REASON_OPTIONS has 5 entries', () => {
    expect(DROP_REASON_OPTIONS).toHaveLength(5);
  });
});
