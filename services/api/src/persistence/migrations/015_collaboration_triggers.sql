-- 015_collaboration_triggers.sql — updated_at triggers for comments.
DROP TRIGGER IF EXISTS trg_comments_updated ON comments;
CREATE TRIGGER trg_comments_updated BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
