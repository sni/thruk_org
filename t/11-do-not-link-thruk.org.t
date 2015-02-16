use strict;
use warnings;
use Test::More;
use Data::Dumper;

my $cmds = [
  'grep -nr "thruk.org" . | grep -v download.thruk | grep -v .git | grep -v .gem | grep -v demo.thruk | grep -v _site/ | grep http: | grep -v home_link'
];

# find all close / mkdirs not ensuring permissions
my @fails;
for my $cmd (@{$cmds}) {
  open(my $ph, '-|', $cmd.' 2>&1') or die('cmd '.$cmd.' failed: '.$!);
  ok($ph, 'cmd started');
  while(<$ph>) {
    my $line = $_;
    chomp($line);
    $line =~ s|//|/|gmx;

    push @fails, $line;
  }
  close($ph);
}

for my $fail (sort @fails) {
    fail($fail);
}

done_testing();
