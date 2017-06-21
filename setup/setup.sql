DROP PROCEDURE IF EXISTS insertmission
GO

create procedure dbo.insertmission(@mission nvarchar(max))
as begin
	insert into mission
	select *
	from OPENJSON(@mission) 
			WITH (	title nvarchar(30), description nvarchar(4000),
					completed bit, dueDate datetime2)
end
GO

select * from mission for json path
