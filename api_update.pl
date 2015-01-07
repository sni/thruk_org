#!/usr/bin/perl

use warnings;
use strict;
use File::Slurp qw/read_file/;
use File::Copy qw/copy/;
use Cwd qw/abs_path/;

my $dir = abs_path($0);
$dir =~ s/api_update\.pl$/api/gmx;
chdir($dir) or die("chdir $dir failed: $!");

my $input_dir = $ARGV[0];
my $lib_dir   = $ARGV[1];
die("usage: $0 <thruk dir> <lib dir>") unless($input_dir and $lib_dir);
die("usage: $0 <thruk dir>  <lib dir>") unless(-d $input_dir.'/lib' && -d $lib_dir);

clean_api();
create_api();
create_index();
exit;


###############################################################################
# create perl api files
sub create_api {
    $input_dir =~ s|/$||gmx;
    $lib_dir =~ s|/$||gmx;
    my $input_paths = [
      $input_dir.'/lib',
      $input_dir.'/plugins/plugins-available/*/lib/',
    ];

    for my $tg (@{$input_paths}) {
        for my $p (glob($tg)) {
            $tg =~ s|/+|/|gmx;
            my $files = `find $p -name \*.pm`;
            for my $f (split/\n/, $files) {
                $f =~ s/^$p//mx;
                my @subdirs = split/\//, $f;
                my $out = pop @subdirs;
                $out    =~ s/\.pm$/.html/;
                my $mkdir = ".";
                for my $dir (@subdirs) {
                    $mkdir = $mkdir.'/'.$dir;
                    mkdir($mkdir);
                }
                $mkdir =~ s|/$||gmx;
                my $cmd = sprintf("/usr/bin/pod2html --htmlroot=%s --podpath=%s --infile=%s --outfile=%s",
                                  '/',
                                  $input_dir.'/lib:'.$lib_dir,
                                  "$p$f",
                                  "$mkdir/$out",
                                 );
                print `$cmd 2>&1`;

                # add jekyll header
                my $name = $out;
                $name =~ s|.html$||gmx;
                my $content = read_file("$mkdir/$out");
                open(my $fh, ">", "$mkdir/$out");
                $content =~ s/\A.*<body[^>]*>//gmxs;
                $content =~ s/<\/body[^>]*>.*\Z//gmxs;
                $mkdir =~ s|^\.||gmx;
                $mkdir =~ s|^\/*||gmx;
                my $breadcrumb = get_breadcrumb($mkdir);
                $content = "---\ntitle: $name\nlayout: api\nbreadcrumb: $breadcrumb\n---\n\n".$content;
                # replace links
                my $basepath = $mkdir."/".$name;
                $content =~ s|\Q$p\E/|api/|gmx;
                $content =~ s#href="/(Monitoring)/#href="/api/$1/#gmx;
                # replace other links to cpan
                $content =~ s|(href=")//\w+/.*?/x86_64-linux-gnu-thread-multi/(.*?)\.html(")|&_replace_cpan_link($1, $2, $3)|gemxis;
                $content =~ s|(href=")//\w+/.*?/perl5/(.*?)\.html(")|&_replace_cpan_link($1, $2, $3)|gemxis;
                $content =~ s|(href=")//\w+/.*?/lib/(.*?)\.html(")|&_replace_cpan_link($1, $2, $3)|gemxis;
                print $fh $content;
                close($fh);
                #print STDERR 'api/'.$mkdir,"/",$name,".html\n";
            }
        }
    }

    # cleanup
    `rm -f *.tmp`;
}

###############################################################################
# create index files for directories
sub create_index {
    for $dir (split(/\n/, `find . -type d`)) {
        my $name = $dir;
        $name =~ s|^.*/||gmx;
        if(-e $dir.'/../'.$name.'.html') {
            copy($dir.'/../'.$name.'.html', $dir.'/index.html');
        } else {
            my @files   = glob($dir.'/*.html');
            my @folders = glob($dir.'/*/.');
            my $breadcrumb_dir = $dir;
            $breadcrumb_dir =~ s|/[^\/]+$||gmx;
            my $breadcrumb = get_breadcrumb($breadcrumb_dir);
            my $content = "---\ntitle: $name\nlayout: api\nbreadcrumb: $breadcrumb\n---\n\n";
            $content .= "
    <div class='panel-body'>
        <ul class='list-group'>
";
            for my $d (@folders) {
                $d =~ s|^\Q$dir\E/||gmx;
                $d =~ s|\/.$||gmx;
                $content .= "<li class='list-group-item'><a href='$d/'><span class='glyphicon glyphicon-folder-close alert-warning' aria-hidden='true'></span> $d</a></li>\n";
            }
            for my $f (@files) {
                next if $f =~ m/index\.html$/gmx;
                $f =~ s|^\Q$dir\E/||gmx;
                $f =~ s|\.html$||gmx;
                $content .= "<li class='list-group-item'><a href='$f.html'><span class='glyphicon glyphicon-book alert-info' aria-hidden='true'></span> $f</a></li>\n";
            }
            $content .= "
        </ul>
    </div>
";
            open(my $fh, ">", $dir.'/index.html');
            print $fh $content;
            close($fh);
        }
    }
}

###############################################################################
# return breadcrumb list
sub get_breadcrumb {
    my($dir) = @_;
    $dir =~ s|^\.+||gmx;
    $dir =~ s|^\/+||gmx;
    my @paths = split(/\//, $dir);
    my $breadcrumb = "";
    my $pre = "";
    for my $p (@paths) {
        $breadcrumb .= ", 'api$pre/$p/', '$p'";
        $pre = $pre."/".$p;
    }
    $breadcrumb =~ s|^,\s+||gmx;
    return("[".$breadcrumb."]");
}

###############################################################################
# clean the api folder
sub clean_api {
    `rm -rf *`;
}

###############################################################################
# replace cpan links
sub _replace_cpan_link {
    my($pre, $mod, $post) = @_;
    if($mod =~ m|Thruk|mx) {
        return($pre."/api/".$mod.".html".$post);
    }
    $mod =~ s|/|%3A%3A|mx;
    return($pre."http://search.cpan.org/perldoc?".$mod.$post);
}